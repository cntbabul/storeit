import { AppwriteFile } from "@/types"
import React from "react";

interface Props {
    file: AppwriteFile;
    onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
    onRemoveUser: (email: string) => void;
}

const ShareInput = ({ file, onInputChange, onRemoveUser }: Props) => {
    return (
        <div>
            Share input
        </div>
    )
}

export default ShareInput