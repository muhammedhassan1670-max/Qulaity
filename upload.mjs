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
        
        console.log("Safely updating files (preserving server 'data/' folder)...");
        try {
            const list = await client.list();
            for (const item of list) {
                // Never delete live server data folder
                if (item.name === "data") {
                    continue;
                }
                if (item.isDirectory) {
                    await client.removeDir(item.name);
                } else {
                    await client.remove(item.name);
                }
            }
        } catch (e) {
            console.warn("Clean warning (proceeding with upload):", e.message);
        }
        
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
