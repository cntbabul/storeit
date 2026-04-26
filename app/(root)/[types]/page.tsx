import React from "react";
import { AppwriteFile, FileType, SearchParamProps } from "@/types";
import Sort from "@/components/Sort";
import { getFiles } from "@/lib/actions/file.actions";
import Card from "@/components/Card";
import { convertFileSize } from "@/lib/utils";



const page = async ({ searchParams, params }: SearchParamProps) => {
    const type = ((await params)?.types as string) || "";
    // console.log("type: ", type)
    const searchText = ((await searchParams)?.query as string) || "";
    const sort = ((await searchParams)?.sort as string) || "";

    const typeMap: Record<string, FileType[]> = {
        documents: ["document"],
        images: ["image"],
        media: ["video", "audio"],
        others: ["other"],
    };
    const types = typeMap[type] ?? [];

    const files = await getFiles({ types, searchText, sort });

    return (
        <div className="page-container">
            <section className="w-full">
                <h1 className="h1 capitalize">All {type}</h1>

                <div className="total-size-section">
                    <p className="body-1">
                        Total: <span className="h5">{convertFileSize(files.documents.reduce((total: number, file: AppwriteFile) => total + Number(file.size), 0))}</span>
                    </p>
                    <div className="sort-container">
                        <p className="body-1 hidden sm:block text-light-200">Sort by:</p>
                        <Sort />
                    </div>
                </div>
            </section>
            {/* render files  */}
            {files.total > 0 ? (
                <section className="file-list">
                    {files.documents.map((file: AppwriteFile) => (
                        <Card file={file} key={file.$id} />

                    ))}
                </section>
            ) : <p className="empty-list">No files found</p>}
        </div>
    )
}

export default page