"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite/client";
import { syncSession } from "@/lib/actions/user.actions";
import Image from "next/image";

const AuthCallback = () => {
    const router = useRouter();

    useEffect(() => {
        const handleSync = async () => {
            try {
                const { jwt } = await account.createJWT();
                
                if (jwt) {
                    await syncSession(jwt);
                    router.push("/");
                } else {
                    router.push("/sign-in");
                }
            } catch (error) {
                console.error("Auth callback error:", error);
                router.push("/sign-in");
            }
        };

        handleSync();
    }, [router]);

    return (
        <div className="flex-center h-screen w-full bg-white">
            <div className="flex flex-col items-center gap-4">
                <Image
                    src="/assets/icons/loader-brand.svg"
                    alt="loader"
                    width={40}
                    height={40}
                    className="animate-spin"
                />
                <p className="subtitle-1 text-brand">Syncing your session...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
