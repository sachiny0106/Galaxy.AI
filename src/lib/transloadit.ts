import crypto from "crypto";

const TRANSLOADIT_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || "";
const TRANSLOADIT_SECRET = process.env.TRANSLOADIT_SECRET || "";

interface TransloaditParams {
    auth: {
        key: string;
        expires: string;
    };
    template_id?: string;
    steps?: Record<string, unknown>;
}

export function createTransloaditSignature(params: TransloaditParams): string {
    const paramsString = JSON.stringify(params);
    return crypto
        .createHmac("sha384", TRANSLOADIT_SECRET)
        .update(paramsString)
        .digest("hex");
}

export function getTransloaditParams(templateId?: string): {
    params: string;
    signature: string;
} {
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const params: TransloaditParams = {
        auth: {
            key: TRANSLOADIT_KEY,
            expires,
        },
    };

    if (templateId) {
        params.template_id = templateId;
    } else {
        // Default upload-only template
        params.steps = {
            uploaded: {
                robot: "/upload/handle",
            },
        };
    }

    const paramsString = JSON.stringify(params);
    const signature = createTransloaditSignature(params);

    return {
        params: paramsString,
        signature,
    };
}

export async function uploadToTransloadit(
    file: File,
    templateId?: string
): Promise<{ url: string; ssl_url: string; name: string }> {
    const { params, signature } = getTransloaditParams(templateId);

    const formData = new FormData();
    formData.append("params", params);
    formData.append("signature", signature);
    formData.append("file", file);

    const response = await fetch("https://api2.transloadit.com/assemblies", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Transloadit upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Poll for completion
    if (result.assembly_ssl_url) {
        let assembly = result;
        while (assembly.ok !== "ASSEMBLY_COMPLETED") {
            await new Promise((r) => setTimeout(r, 1000));
            const pollResponse = await fetch(assembly.assembly_ssl_url);
            assembly = await pollResponse.json();

            if (assembly.error) {
                throw new Error(`Transloadit error: ${assembly.error}`);
            }
        }

        // Get the uploaded file URL
        const uploads = assembly.uploads || [];
        if (uploads.length > 0) {
            return {
                url: uploads[0].url,
                ssl_url: uploads[0].ssl_url,
                name: uploads[0].name,
            };
        }
    }

    throw new Error("No file uploaded");
}

export function isTransloaditConfigured(): boolean {
    return Boolean(TRANSLOADIT_KEY && TRANSLOADIT_SECRET);
}
