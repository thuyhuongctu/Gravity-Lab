import { tr } from "@/lib/prefs";

/** Concept DOI: covers every version and always resolves to the latest. Shown in the header. */
export const APP_DOI = "10.5281/zenodo.23307832";
export const APP_DOI_URL = `https://doi.org/${APP_DOI}`;
/** The archived release this build is cited as. */
export const APP_VERSION = "v2.1";
export const VERSION_DOI = "10.5281/zenodo.23308307";
export const VERSION_DOI_URL = `https://doi.org/${VERSION_DOI}`;

/** How to cite Gravity Lab itself, with its Zenodo DOI. */
export function CiteApp() {
  return (
    <div className="pb-2">
      <p className="text-sm font-medium">{tr("Trích dẫn ứng dụng này", "Cite this app")}</p>
      <p className="mt-1 ps-6 text-sm leading-relaxed text-muted [text-indent:-1.5rem]">
        Phan, A. T., & Do, T. H. (2026).{" "}
        <em>Gravity Lab: a browser-based gravity-model laboratory for FDI into Vietnam</em> (Version{" "}
        {APP_VERSION}) [Computer software]. Zenodo.{" "}
        <a
          className="underline decoration-line underline-offset-2"
          href={VERSION_DOI_URL}
          target="_blank"
          rel="noreferrer"
        >
          {VERSION_DOI_URL}
        </a>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {tr("DOI khái niệm, cho mọi phiên bản: ", "Concept DOI, covering all versions: ")}
        <a
          className="underline decoration-line underline-offset-2"
          href={APP_DOI_URL}
          target="_blank"
          rel="noreferrer"
        >
          {APP_DOI}
        </a>
      </p>
    </div>
  );
}
