"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "./ui/input";
import { createUrlParams } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { AppwriteFile } from "@/types";
import { getFiles } from "@/lib/actions/file.actions";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { useDebounce } from "use-debounce";

const Search = () => {
    const router = useRouter();
    const path = usePathname();
    const [query, setQuery] = useState("");
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("query") || "";
    const [results, setResults] = useState<AppwriteFile[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery] = useDebounce(query, 300)



    useEffect(() => {
        const fetchFiles = async () => {
            if (debouncedQuery.length === 0) {
                setResults([]);
                setOpen(false);
                return;
            }

            setLoading(true);
            const files = await getFiles({ types: [], searchText: debouncedQuery });
            setResults(files.documents);
            setLoading(false);
        };

        fetchFiles();
    }, [debouncedQuery]);

    useEffect(() => {
        if (query.length > 0) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [query]);

    useEffect(() => {
        if (!searchQuery) {
            setQuery("");

        }
    }, [searchQuery]);

    const handleClickItem = (file: AppwriteFile) => {
        setOpen(false);
        setResults([]);

        router.push(
            `/${file.type === "video" || file.type === "audio" ? "media" : file.type + "s"}?query=${file.name}`,
        );
    };

    return (
        <div className="search">
            <div className="search-input-wrapper">
                <Image src="/assets/icons/search.svg" alt="search" width={24} height={24} />
                <Input
                    placeholder="Search files..."
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            {open && (
                <ul className="search-result">
                    {results.length > 0 ? (
                        results.map((file) => (
                            <li
                                key={file.$id}
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => handleClickItem(file)}
                            >
                                <div className="flex items-center gap-4">
                                    <Thumbnail
                                        type={file.type}
                                        extension={file.extension}
                                        url={file.url}
                                        className="size-9 min-w-9"
                                    />
                                    <p className="subtitle-2 line-clamp-1 text-light-100">{file.name}</p>
                                </div>
                                <FormattedDateTime
                                    date={file.$createdAt}
                                    className="caption line-clamp-1 text-light-200"
                                />
                            </li>
                        ))
                    ) : (
                        <p className="empty-result">{loading ? "Searching..." : "No files found"}</p>
                    )}
                </ul>
            )}
        </div>
    );
};

export default Search;