import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.*;
import java.util.*;
import java.util.zip.*;
import javax.crypto.*;
import javax.crypto.spec.*;

/** Encrypt existing signing bytes; never generate or export a replacement signer. */
class ArchiveOriginal {
    static String required(String name) {
        String value=System.getenv(name);
        if(value==null || value.isBlank()) throw new IllegalArgumentException();
        return value;
    }
    static void archive(Path output, Path identityPath) throws Exception {
        String identity=Files.readString(identityPath);
        byte[] material=Base64.getDecoder().decode(required("SIGNING_KEYSTORE_BASE64"));
        byte[] recovery=Base64.getDecoder().decode(required("RECOVERY_KEY_BASE64"));
        if(material.length==0 || material.length>1024*1024 || recovery.length!=32) throw new IllegalArgumentException();
        char[] storePassword=required("SIGNING_STORE_PASSWORD").toCharArray();
        char[] keyPassword=required("SIGNING_KEY_PASSWORD").toCharArray();
        String alias=RecoveryVerify.field(identity,"alias");
        KeyStore ks=KeyStore.getInstance("PKCS12");
        ks.load(new ByteArrayInputStream(material),storePassword);
        PrivateKey original=(PrivateKey)ks.getKey(alias,keyPassword);
        var cert=ks.getCertificate(alias);
        if(original==null || cert==null || !RecoveryVerify.hash(cert.getEncoded()).equals(RecoveryVerify.field(identity,"certificateSha256"))) throw new IllegalArgumentException();
        byte[] challenge=new byte[64];new SecureRandom().nextBytes(challenge);
        Signature signature=Signature.getInstance(original.getAlgorithm().equals("EC")?"SHA256withECDSA":"SHA256withRSA");
        signature.initSign(original);signature.update(challenge);byte[] signed=signature.sign();
        signature.initVerify(cert);signature.update(challenge);
        if(!signature.verify(signed)) throw new IllegalArgumentException();
        Properties props=new Properties();
        for(String name:List.of("alias","certificateSha256","packageName","repository")) props.setProperty(name,RecoveryVerify.field(identity,name));
        props.setProperty("storePassword",new String(storePassword));
        props.setProperty("keyPassword",new String(keyPassword));
        props.setProperty("keystoreSha256",RecoveryVerify.hash(material));
        ByteArrayOutputStream settings=new ByteArrayOutputStream();props.store(settings,null);
        ByteArrayOutputStream plain=new ByteArrayOutputStream();
        try(var zip=new ZipOutputStream(plain)) {
            zip.putNextEntry(new ZipEntry("original.keystore"));zip.write(material);zip.closeEntry();
            zip.putNextEntry(new ZipEntry("signing.properties"));zip.write(settings.toByteArray());zip.closeEntry();
        }
        byte[] nonce=new byte[12];new SecureRandom().nextBytes(nonce);
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(recovery,"AES"),new GCMParameterSpec(128,nonce));
        cipher.updateAAD(RecoveryVerify.AAD);
        byte[] ciphertext=cipher.doFinal(plain.toByteArray());
        Files.createFile(output,PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        try(var stream=Files.newOutputStream(output)) {stream.write(RecoveryVerify.MAGIC);stream.write(nonce);stream.write(ciphertext);}
        Arrays.fill(recovery,(byte)0);Arrays.fill(material,(byte)0);
        Arrays.fill(storePassword,'\0');Arrays.fill(keyPassword,'\0');
        // Verification has only the recovery credential, not a plaintext file.
        RecoveryVerify.verify(output,identityPath);
    }
    public static void main(String[] args) {
        try {archive(Path.of(args[0]),Path.of(args[1]));}
        catch(Exception error) {System.err.println("Original-key encrypted backup failed; sensitive diagnostics withheld.");System.exit(1);}
    }
}
