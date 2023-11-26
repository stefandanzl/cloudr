import { CloudrFile } from "../types";
import { list } from "../services/navigate";
import { pathJoin } from "../component/Uploader/core/utils";

export function getPreviewPath(selected: any): string {
    return encodeURIComponent(
        selected.path === "/"
            ? selected.path + selected.name
            : selected.path + "/" + selected.name
    );
}

export async function walk(
    file: CloudrFile[],
    share: any
): Promise<CloudrFile[]> {
    let res: CloudrFile[] = [];
    for (const f of file) {
        if (f.type === "file") {
            res.push(f);
            continue;
        }

        if (f.type === "dir") {
            const response = await list(
                pathJoin([f.path, f.name]),
                share,
                "",
                ""
            );
            const subs = await walk(response.data.objects, share);
            res = [...res, ...subs];
        }
    }

    return res;
}
