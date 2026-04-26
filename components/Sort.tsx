"use client"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { sortTypes } from "@/constants";
import { usePathname, useRouter } from "next/navigation";

const Sort = () => {
    const router = useRouter();
    const path = usePathname();

    const handleSort = (value: string) => {
        router.push(`${path}?sort=${value}`)

    }


    return (
        <Select onValueChange={handleSort} defaultValue={sortTypes[0].value} >
            <SelectTrigger className="sort-select cursor-pointer">
                <SelectValue placeholder={sortTypes[0].value} />
            </SelectTrigger>
            <SelectContent className="sort-select-content">
                <SelectGroup>
                    {sortTypes.map((sort) => (
                        <SelectItem key={sort.label} value={sort.value} >
                            {sort.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select >

    )
}

export default Sort
