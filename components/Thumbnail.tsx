import React from "react";
import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

interface Props {
    type: string;
    extension: string;
    url?: string;
    imageClassName?: string;
    className?: string;
}

const Thumbnail = ({
    type,
    extension,
    url = "",
    imageClassName,
    className,
}: Props) => {
    const isImage = type === "image" && extension !== "svg";

    return (
        <figure className={cn("thumbnail relative", className)}>
            <Image
                src={isImage ? url : getFileIcon(extension, type)}
                alt="thumbnail"
                fill
                className={cn(
                    "object-contain",
                    imageClassName,
                    isImage && "thumbnail-image",
                )}
                unoptimized
            />
        </figure>
    );
};
export default Thumbnail;