import ftp from "basic-ftp";

async function upload() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log("Connecting to FTP...");
        await client.access({
            host: "ftpupload.net",
            user: "if0_43141924",
            password: "HDxAE0Xj2a",
            secure: false
        });
        console.log("Connected successfully!");
        
        console.log("Navigating to htdocs...");
        await client.ensureDir("htdocs");
        
        console.log("Clearing old files...");
        await client.clearWorkingDir();
        
        console.log("Uploading new build (dist)...");
        await client.uploadFromDir("dist");
        
        console.log("Upload completed successfully!");
    }
    catch(err) {
        console.error("FTP Error:", err);
    }
    client.close();
}

upload();
