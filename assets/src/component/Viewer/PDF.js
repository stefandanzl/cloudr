import React, { useCallback, useState, useEffect, useRef } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useLocation, useParams, useRouteMatch, Prompt } from "react-router";
import { baseURL, getBaseURL } from "../../middleware/Api";
import { useDispatch } from "react-redux";
import pathHelper from "../../utils/page";
// import TextLoading from "../Placeholder/TextLoading";
import { toggleSnackbar } from "../../redux/explorer";
import UseFileSubTitle from "../../hooks/fileSubtitle";
import { useTranslation } from "react-i18next";
// import PdfViewerComponent from "./PdfViewerComponent";
import SaveButton from "../Dial/Save";
import API from "../../middleware/Api";
import { Eraser } from "mdi-material-ui";
// import { PDFDocument } from 'pdf-lib'
import "./PDF.css"
import { TOOLBAR } from "./PDFSettings"

const useStyles = makeStyles((theme) => ({
    layout: {
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
        marginBottom: 0,
        // overflow: "hidden",
        // width: "100%",
        // height: "100vh"
    },
    "@global": {
        canvas: {
            // width: "100% !important",
            // height: "auto !important",
            borderRadius: theme.shape.borderRadius,
        },
        ".overflow-guard": {
            borderRadius: "0 0 12px 12px!important",
        },
    },
    paper: {
        marginBottom: theme.spacing(3),
    },
}));

function useQuery() {
    return new URLSearchParams(useLocation().search);
}



export default function PDFViewer() {
    const containerRef = useRef(null);

    const pdfKitRef = useRef(null);

    //  idRef // = useRef(null);

    const { t } = useTranslation();
    const match = useRouteMatch();
    const location = useLocation();
    const query = useQuery();
    const { id } = useParams();

    const $vm = React.createRef();
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);


    const [pdfInstance, setPdfInstance] = useState(null);
    // const pdfInstance = useRef(null);
    const [contentState, setContentState] = useState("unchanged");
    const [pdfState, setPdfState] = useState(true);
    const [pdfSettings, setPdfSettings] = useState({ pageData: {}, savePage: true, autoSave: true, autoSaveInterval: 10, changePrompt: true, saveButton: true })

    const [pageNumber, setPageNumber] = useState(0);
    const [lastPageSaved, setLastPageSaved] = useState(0)    // or ()=>Date.now()
    const timeoutRef = useRef(null);

    const [pageDB, setPageDB] = useState({})
    const { title, path } = UseFileSubTitle(query, match, location);
    const [pageInit, setPageInit] = useState(true);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );



    function getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }


    // Last viewed Page Number gets stored in PDF file's Producer Field
    //  const loadPdf = async (url) => {
    //     try {
    //         const pdfBytes = await fetch(url).then(res => res.arrayBuffer());
    //         const pdfDoc = await PDFDocument.load(pdfBytes);
    //         const producer = pdfDoc.getProducer();
    //         if (typeof producer === 'string' && !isNaN(producer)) {
    //             setPageNumber(parseInt(producer, 10));
    //         }
    //         return pdfBytes;
    //     } catch (error) {
    //         console.error('Error loading PDF:', error);
    //         throw error; // Rethrow the error for further handling if needed
    //     }
    // };

    const savePageData = async (pageIndex = -1) => {
        try {


            const id = query.get("id")

            //`{"pdf":{"pageData":{"${id}":{"page":${pageNumber}}}}}`
            const page = pageIndex === -1 ? pageNumber : pageIndex


            const content =
            {
                "pdf": {
                    "pageData": {
                        [id]: {
                            page: page
                        }
                    }
                }
            }
            await API.patch("/user/setting/pdf", content)

            console.log("uploaded pageDB successfully", getCurrentTime())
            return true


        } catch (error) {
            console.log("ERRROR uploading pageDB", error.message, getCurrentTime())
            // ToggleSnackbar("top", "right", "Saving PageData failed", "error");
            return false
        }
    }

    const save = async () => {

        console.log("SAVE FUNCTION START", getCurrentTime())
        if (contentState === "saving") { return }
        try {
            if (!pdfInstance) {
                // Handle the case where pdfInstance is not available yet
                console.log("PDF instance not available.", getCurrentTime());
                return;
            }

            const savePageDataSuccess = await savePageData()

            if (contentState !== "modified") {
                if (savePageDataSuccess) {
                    setStatus("success");
                    setTimeout(() => setStatus(""), 2000);
                    console.log("Not saving PDF because no changes have been made.")
                }
                return
            }
            setContentState("saving")
            console.log("exporting PDF", getCurrentTime())
            // const arrayBuffer = await pdfInstance.exportPDF();
            const arrayBuffer = await pdfInstance.exportPDF();   //let
            console.log("exported PDF", getCurrentTime())
            // if (pageNumber > 1){
            //     let pdfDoc = await PDFDocument.load(arrayBuffer)
            //     pdfDoc = pdfDoc.setProducer(pageNumber.toString())
            //     arrayBuffer = await pdfDoc.save()
            // }

            const blob = new Blob([arrayBuffer], { type: "application/pdf" });
            console.log("blob finished", getCurrentTime())
            API.put("/file/update/" + query.get("id"), blob)
                .then(() => {
                    console.log("upload PDF fishish", getCurrentTime())
                    setContentState((prev) => { return "unchanged" });
                    console.log("saved successfully!", getCurrentTime());
                    setStatus("success");
                    setTimeout(() => setStatus(""), 2000);
                })
                .catch((error) => {
                    console.log("upload PDF fail", getCurrentTime())
                    setContentState((prev) => { return "modified" });
                    console.log("saved failed!", getCurrentTime());
                    setStatus("");
                    ToggleSnackbar("top", "right", error.message, "error");
                });
        } catch (error) {
            console.error("Error exporting PDF:", error, getCurrentTime());
        }

    };

    useEffect(() => {
        if (pageInit && pdfInstance && pageDB) {
            setPageInit(false)
            if (pageNumber)

                pdfInstance.setViewState(v => v.set("currentPageIndex", pageNumber));
        }

    }, [pageInit, pdfInstance, pageDB])


    async function fetchSettings() {
        const response = await API.get("/user/setting")
        if (response.status !== 200) {
            console.error("Error getting setting 'pdf'")
            ToggleSnackbar("top", "right", "Loading PDF Settings failed", "error");
            return
        }

        try {
            if (!("pdf" in response.data)) {
                throw new Error("No pdf object in response")
            }

            setPdfSettings({
                savePage: response.data.pdf.savePage,
                pageData: response.data.pdf.pageData,
                autoSave: response.data.pdf.autoSave,
                autoSaveInterval: response.data.pdf.autosaveInterval,
                changePrompt: response.data.pdf.changePrompt,
                saveButton: response.data.pdf.saveButton,
            })

            const id = query.get("id")

            const pageNumber = response?.data?.pdf?.pageData[id]?.page;
            if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {
                setPageNumber(pageNumber);
            }

        } catch (err) {
            ToggleSnackbar("top", "right", err.message, "error");
        }

    }

    useEffect(() => {

        // if (isFetchSettings) {
        //     setFetchSettings(false);
        //     fetchSettings();
        // }
        fetchSettings();
    }, [])


    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            console.log('Ctrl+S pressed');
            save();
        }
    };

    const loadPdfContainer = async () => {
        let PSPDFKit = null;
        const container = containerRef.current;

        const baseURL = "https://cdn.danzl.it/pspdfkit/pspdfkit-2023.5.2/"                                      // WEB
        // const baseURL = `${window.location.protocol}//${window.location.host}/${process.env.PUBLIC_URL}`      // LOCAL                                                      
        PSPDFKit = await import("pspdfkit");

        pdfKitRef.current = PSPDFKit;
        // LOCAL
        //PSPDFKit = await import(cdnBase+'pspdfkit.js'); 
        const annotationPresets = PSPDFKit.defaultAnnotationPresets;
        annotationPresets.highlighter.lineWidth = 12;
        annotationPresets.ink.lineWidth = 1;

        const allowedTypes = ["sidebar-thumbnails", "sidebar-document-outline", "sidebar-annotations", "sidebar-bookmarks"];

        let toolbarItems = PSPDFKit.defaultToolbarItems;

        toolbarItems = toolbarItems
            .filter(item => allowedTypes.includes(item.type))
            .map(item => ({ ...item })); // Create a new array with the filtered items

        // Now toolbarItems is a new array with the desired items


        toolbarItems.push(
            ...TOOLBAR
        );

        const document = getBaseURL() + (pathHelper.isSharePage(location.pathname) ? "/share/preview/" + id +
            (query.get("share_path") !== "" ? "?path=" + encodeURIComponent(query.get("share_path")) : "")
            : "/file/preview/" + query.get("id"));



        // const loadPdf = async () => {
        // (async function () {
        // try {
        //     PSPDFKit.unload(containerRef.current);
        // } catch {
        //     console.log("no instance")
        // }

        if (pdfKitRef.current && containerRef.current) {
            pdfKitRef.current.unload(containerRef.current);
            setPdfInstance(null);
        }


        try {
            const instance = await PSPDFKit.load({
                container: containerRef.current,
                document,
                baseUrl: baseURL,
                // baseUrl: cdnBase,
                annotationPresets,
                toolbarItems,
                theme: PSPDFKit.Theme.DARK,
                toolbarPlacement: PSPDFKit.ToolbarPlacement.BOTTOM,

                enableClipboardActions: true,
                enableHistory: true,
                // initialViewState: new PSPDFKit.ViewState({
                //     pageIndex: pageNumber,
                //     // sidebarMode: PSPDFKit.SidebarMode.THUMBNAILS
                //   })
            })
                .then(async (instance) => {
                    // instancer = instance;
                    // instanceRef = instance;
                    // idRef = query.get("id");
                    setPdfInstance(instance);
                    // pdfInstance.current = instance;
                    console.log("INSTANCEEE:", pdfInstance)


                    if (pageNumber) {
                        instance.setViewState(v => v.set("currentPageIndex", pageNumber));
                    }

                    /*
                                        // https://www.nutrient.io/api/web/PSPDFKit.Instance.html#~ViewStateCurrentPageIndexChangeEvent
                                        instance.addEventListener("viewState.currentPageIndex.change", (pageIndex) => {
                                            try {
                    
                                                console.log("pageIndex:", pageIndex);
                                                setPageNumber(Number(pageIndex))
                    
                                                if (Date.now() - lastPageSaved > 1000 * 10) {
                                                    setLastPageSaved(Date.now())
                                                    savePageData(pageIndex)
                                                }
                                            } catch (err) {
                                                console.log("KKKK ", err)
                                            }
                                        });*/

                    // function createGoToAction(pageIndex) {
                    //     return new PSPDFKit.Actions.GoToAction({ pageIndex });
                    //   }

                    // https://www.nutrient.io/api/web/PSPDFKit.Instance.html#contentDocument
                    instance.contentDocument.addEventListener("keydown", handleKeyDown);

                    instance.addEventListener(
                        "annotations.willChange",
                        (event) => {
                            const annotation = event.annotations.get(0);
                            if (
                                event.reason ===
                                PSPDFKit.AnnotationsWillChangeReason
                                    .DELETE_START
                            ) {
                                console.log(
                                    "Will open deletion confirmation dialog"
                                );
                                // We need to wrap the logic in a setTimeOut() because modal will get actually rendered on the next tick
                                setTimeout(function () {
                                    // The button is in the context of the PSPDFKit iframe
                                    const button =
                                        instance.contentDocument.getElementsByClassName(
                                            "PSPDFKit-Confirm-Dialog-Button-Confirm"
                                        )[0];
                                    button.click(); //.focus()
                                }, 0);
                            }
                        }
                    );


                    // instance.addEventListener("annotations.change", () => {
                    //     console.log("Something in the annotations has changed.");
                    //   });
                    instance.addEventListener("annotations.create", createdAnnotations => {
                        setContentState((prev) => { return "modified" });
                        console.log("createdAnnotations", createdAnnotations);
                    });
                    // instance.addEventListener("annotations.update", updatedAnnotations  => {
                    //     setContentState((prev) => { return "modified" });
                    //     console.log("updatedAnnotations ", updatedAnnotations );
                    // });
                    instance.addEventListener("annotations.delete", deletedAnnotations => {
                        setContentState((prev) => { return "modified" });
                        console.log("deletedAnnotations ", deletedAnnotations);
                    });


                }).catch((error) => {
                    console.error('PSPDFKit loading error:', error);
                });

        } catch (error) {
            console.error("Error loading PSPDFKit:", error);
        }
        // })();

        // const pdfFunc = loadPdf();

    }

    //  Immediately invoked function expression (async function () {  })();

    useEffect(() => {
        // const container = containerRef.current;
        // let PSPDFKit;    // LOCAL and WEB

        // const cdnBase = "https://cdn.danzl.it/pspdfkit/pspdfkit-2023.5.2/"                                  // WEB
        // const baseURL = cdnBase                                                                             // WEB
        // const scriptUrl = cdnBase + '/pspdfkit.js';                                                         // WEB
        // loadScript(scriptUrl).then                                                                          // WEB

        if (pdfState) {
            setPdfState(false);

            loadPdfContainer()

            // document.then(async (doc) => { pdfInstance.load({document: doc})})

            return () => {
                pdfKitRef.current && pdfKitRef.current.unload(containerRef.current);
                if (pdfInstance) {
                    pdfInstance.destroy();
                }
            };
        }


    }, [pdfSettings]);


    useEffect(() => {
        if (!pdfInstance) return;

        const handlePageChange = (pageIndex) => {
            try {
                console.log("pageIndex:", pageIndex);
                setPageNumber(Number(pageIndex));

                // Clear existing timeout using ref
                if (timeoutRef.current) {
                    console.log("Clearing timeout:", timeoutRef.current);
                    clearTimeout(timeoutRef.current);
                }

                // Set new timeout and store in ref
                const timeoutId = setTimeout(() => {
                    console.log("Saving after 10s on page", pageIndex);
                    savePageData(pageIndex);
                    timeoutRef.current = null;
                }, 1000 * 10);

                timeoutRef.current = timeoutId;
                console.log("New timeout set:", timeoutId);

            } catch (err) {
                console.error("Error handling page change:", err);
            }
        };

        pdfInstance.addEventListener("viewState.currentPageIndex.change", handlePageChange);

        return () => {
            pdfInstance.removeEventListener("viewState.currentPageIndex.change", handlePageChange);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };

    }, [pdfInstance]);

    useEffect(() => {

        if (pdfSettings.changePrompt && contentState !== "unchanged") {
            const handler = (event) => {
                event.preventDefault();
                event.returnValue = "";
            };

            // https://www.wpeform.io/blog/exit-prompt-on-window-close-react-app/
            // if the form is NOT unchanged, then set the onbeforeunload

            window.addEventListener("beforeunload", handler);
            // clean it up, if the dirty state changes
            return () => {
                window.removeEventListener("beforeunload", handler);
            };

        }
        // eslint-disable-line 
        //   return () => {};
    }, [pdfSettings, contentState])


    function useKey(key, cb) {
        const callback = useRef(cb);

        useEffect(() => {
            callback.current = cb;
        });

        useEffect(() => {
            function handle(event) {
                if (key === 'ctrls' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                    event.preventDefault();
                    callback.current(event);
                    return;
                }

                if (event.code === key) {
                    callback.current(event);
                }
            }

            // Changed from document to window
            window.addEventListener('keydown', handle);
            return () => window.removeEventListener('keydown', handle);
        }, [key]);
    }

    useKey('ctrls', (e) => {
        console.log('Ctrl+S pressed');
        save();
    });


    // // Function to check and save changes if unsaved
    // const checkAndSaveChanges = () => {
    //   // Replace this condition with your logic to check for unsaved changes

    //   if (contentState!=="unchanged") {
    //     save();
    //   }
    // };


    // Conditionally run the useEffect hook based on autoSaveEnabled

    useEffect(() => {
        if (pdfSettings.autoSave) {
            const intervalId = setInterval(() => {
                // Example usage
                const currentTime = getCurrentTime();
                // setContentState(contentState == "modified" ? "unchanged" : "modified")
                console.log(currentTime); // Outputs something like "12:34"
                console.log("INTERVAL")
                console.log(contentState)
                // if (contentState !== "unchanged") {       disabled because handled by save() function
                save();
                // }
            }, 1000 * pdfSettings.autoSaveInterval); // 20 seconds = 20000

            // Clean up interval when the component is unmounted
            return () => clearInterval(intervalId);
        }
    }, [pdfSettings, contentState]);


    const classes = useStyles();
    return (
        <div className={classes.layout}>
            <Prompt
                when={pdfSettings.changePrompt && contentState !== "unchanged"}
                message='You have unsaved changes, are you sure you want to leave?'
            />
            {pdfSettings.saveButton && <SaveButton onClick={save} status={status} />}
            <div
                style={{ margin: 0, top: 84, bottom: "auto", right: 20, left: "auto", zIndex: 1500, position: "fixed" }} >
                <h2>{pageNumber}</h2></div>
            <div
                ref={containerRef}
                style={{ width: "100%", height: "calc(100vh - 64px)" }}
            />
        </div>
    );
}
// id="btn"
