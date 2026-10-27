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
        
        console.log("Removing stale PWA manifest and workbox files to prevent MIME errors...");
        try { await client.remove("manifest.webmanifest"); } catch(e) {}
        try { await client.remove("manifest.json"); } catch(e) {}
        try {
            const list = await client.list();
            for (const item of list) {
                if (item.name.startsWith("workbox-")) {
                    await client.remove(item.name);
                    console.log("Removed stale workbox bundle:", item.name);
                }
            }
        } catch(e) {}

        console.log("Uploading fresh build with zero-downtime asset preservation...");
        await client.uploadFromDir("dist");
        
        console.log("Upload completed successfully!");
    }
    catch(err) {
        console.error("FTP Error:", err);
    }
    client.close();
}

upload();
