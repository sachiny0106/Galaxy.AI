import { NextResponse } from "next/server";
import crypto from "crypto";

const TRANSLOADIT_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || "";
const TRANSLOADIT_SECRET = process.env.TRANSLOADIT_SECRET || "";

export async function POST() {
    try {
        if (!TRANSLOADIT_KEY || !TRANSLOADIT_SECRET) {
            return NextResponse.json(
                { error: "Transloadit not configured" },
                { status: 500 }
            );
        }

        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const params = {
            auth: {
                key: TRANSLOADIT_KEY,
                expires,
            },
            steps: {
                uploaded: {
                    robot: "/upload/handle",
                },
            },
        };

        const paramsString = JSON.stringify(params);
        const signature = crypto
            .createHmac("sha384", TRANSLOADIT_SECRET)
            .update(paramsString)
            .digest("hex");

        return NextResponse.json({
            params: paramsString,
            signature,
            assemblyUrl: "https://api2.transloadit.com/assemblies",
        });
    } catch (error) {
        console.error("Transloadit signature error:", error);
        return NextResponse.json(
            { error: "Failed to generate signature" },
            { status: 500 }
        );
    }
}
