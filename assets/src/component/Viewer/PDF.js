import React, { useCallback, useState, useEffect, useRef } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useLocation, useParams, useRouteMatch } from "react-router";
import { baseURL, getBaseURL } from "../../middleware/Api";
import { useDispatch } from "react-redux";
import pathHelper from "../../utils/page";
// import TextLoading from "../Placeholder/TextLoading";
import { toggleSnackbar } from "../../redux/explorer";
import UseFileSubTitle from "../../hooks/fileSubtitle";
// import { useTranslation } from "react-i18next";
// import PdfViewerComponent from "./PdfViewerComponent";
import SaveButton from "../Dial/Save";
import API from "../../middleware/Api";
import { Eraser } from "mdi-material-ui";


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

    //  idRef // = useRef(null);

    // const { t } = useTranslation();
    const math = useRouteMatch();
    const location = useLocation();
    const query = useQuery();
    const { id } = useParams();
    UseFileSubTitle(query, math, location);

    const $vm = React.createRef();
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);

    let instancer;
    const [pdfInstance, setPdfInstance] = useState(null);
    const [idRef, setIdRef] = useState(null);
    const [contentState, setContentState] = useState("unchanged");
    const [pdfState, setPdfState] = useState(true);
    const autoSaveEnabled = true;

    // const [pageNumber, setPageNumber] = useState(1);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );



    const save = async () => {
        try {
            if (!pdfInstance) {
                // Handle the case where pdfInstance is not available yet
                console.error("PDF instance not available.");
                return;
            }
            setContentState("saving")

            // const arrayBuffer = await pdfInstance.exportPDF();
            const arrayBuffer = await pdfInstance.exportPDF();
            const blob = new Blob([arrayBuffer], { type: "application/pdf" });

            API.put("/file/update/" + query.get("id"), blob)
                .then(() => {
                    setContentState((prev) => { return "unchanged" });
                    console.log("saved successfully!");
                    setStatus("success");
                    setTimeout(() => setStatus(""), 2000);
                })
                .catch((error) => {
                    setContentState((prev) => { return "modified" });
                    console.log("saved failed!");
                    setStatus("");
                    ToggleSnackbar("top", "right", error.message, "error");
                });
        } catch (error) {
            console.error("Error exporting PDF:", error);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        // let PSPDFKit;    // LOCAL and WEB

        // const cdnBase = "https://cdn.danzl.it/pspdfkit/pspdfkit-2023.5.2/"                                  // WEB
        // const baseURL = cdnBase                                                                             // WEB
        // const scriptUrl = cdnBase + '/pspdfkit.js';                                                         // WEB
        // loadScript(scriptUrl).then                                                                          // WEB
        
            if (pdfState) {
                setPdfState(false);
                let PSPDFKit;

                (async function(){
                    const baseURL = `${window.location.protocol}//${window.location.host}/${process.env.PUBLIC_URL}`      // LOCAL                                                      
                    PSPDFKit = await import("pspdfkit");                                                                  // LOCAL
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
                        {
                            type: "responsive-group",
                            id: "m-hide",
                            mediaQueries: ["max-width: 600px"],
                            icon: "https://example.com/icon.png",
                        }, {
                        type: "document-editor",
                        dropdownGroup: "doc",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "document-crop",
                        dropdownGroup: "doc",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "export-pdf",
                        dropdownGroup: "doc",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "print",
                        dropdownGroup: "doc",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "zoom-out",
                        dropdownGroup: "zoom",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "zoom-in",
                        dropdownGroup: "zoom",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "zoom-mode",
                        dropdownGroup: "zoom",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "search",
                        dropdownGroup: "zoom",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "spacer",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "highlighter",
                        title: "gelb",
                        id: "gelb",
                        dropdownGroup: "gelb",
                    }, {
                        type: "ink",
                        dropdownGroup: "pen",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "ink-eraser",
                        dropdownGroup: "rubber",
                    }, {
                        type: "text-highlighter",
                        dropdownGroup: "hightext",
                        selected: true,
                        responsiveGroup: "m-hide",
                    }, {
                        type: "callout",
                        dropdownGroup: "add",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "note",
                        dropdownGroup: "add",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "text",
                        dropdownGroup: "add",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "link",
                        dropdownGroup: "add",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "image",
                        dropdownGroup: "add",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "stamp",
                        dropdownGroup: "add",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "line",
                        dropdownGroup: "line",
                        responsiveGroup: "m-hide",
                        //selected: true,
                    }, {
                        type: "arrow",
                        dropdownGroup: "line",
                        responsiveGroup: "m-hide",
                        //selected: true,
                    }, {
                        type: "rectangle",
                        dropdownGroup: "line",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "polygon",
                        dropdownGroup: "line",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "multi-annotations-selection",
                        dropdownGroup: "multi",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "spacer",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "highlighter",
                        dropdownGroup: "h1",
                        responsiveGroup: "m-hide",
                    }, {
                        type: "pan",
                        dropdownGroup: "pan2",
                    }

                    );

                    const document =
                        getBaseURL() +
                        (pathHelper.isSharePage(location.pathname)
                            ? "/share/preview/" +
                            id +
                            (query.get("share_path") !== ""
                                ? "?path=" +
                                encodeURIComponent(query.get("share_path"))
                                : "")
                            : "/file/preview/" + query.get("id"));



                    // const loadPdf = async () => {
                    // (async function () {
                        try {
                            PSPDFKit.unload(container);
                        } catch {
                            console.log("no instance")
                        }


                        try {
                            const instance = await PSPDFKit.load({
                                container,
                                document,
                                baseUrl: baseURL,
                                // baseUrl: cdnBase,
                                annotationPresets,
                                toolbarItems,
                                theme: PSPDFKit.Theme.DARK,
                                toolbarPlacement: PSPDFKit.ToolbarPlacement.BOTTOM,

                                enableClipboardActions: true,
                                enableHistory: true
                            })
                                .then(async (instance) => {
                                    // instancer = instance;
                                    // instanceRef = instance;
                                    // idRef = query.get("id");
                                    setPdfInstance(instance);
                                    console.log("INSTANCEEE:", pdfInstance)

                                    // instance.addEventListener(
                                    //     "document.saveStateChange",
                                    //     async (event) => {
                                    //         console.log(
                                    //             `Save state changed: ${event.hasUnsavedChanges}`
                                    //         );
                                    //         //   console.log(props.id)
                                    //         // if (event.hasUnsavedChanges){save()}
                                    //     }
                                    // );


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
                                        console.log("BEFORE", contentState)
                                        setContentState((prev) => { return "modified" });
                                        console.log("AFTER", contentState)
                                        console.log("createdAnnotations", createdAnnotations);
                                    });


                                }).catch((error) => {
                                    console.error('PSPDFKit loading error:', error);
                                });

                            console.log("STRINGGGif", JSON.stringify(pdfInstance));
                        } catch (error) {
                            console.error("Error loading PSPDFKit:", error);
                        }
                    // })();

                    // const pdfFunc = loadPdf();
                })();

                return () => {
                    PSPDFKit && PSPDFKit.unload(container);
                    if (pdfInstance) {
                        pdfInstance.destroy();
                    }
                };}

                // PSPDFKit && ;
            }, [pdfState, contentState]);


    useEffect(()=>{

        const handler = (event) => {
            event.preventDefault();
            event.returnValue = "";
          };

          // https://www.wpeform.io/blog/exit-prompt-on-window-close-react-app/
          // if the form is NOT unchanged, then set the onbeforeunload
          if (contentState !== "unchanged") {
            window.addEventListener("beforeunload", handler);
            // clean it up, if the dirty state changes
            return () => {
              window.removeEventListener("beforeunload", handler);
            };
          }
        // eslint-disable-line 
        //   return () => {};
    },[contentState])



    // // Function to check and save changes if unsaved
    // const checkAndSaveChanges = () => {
    //   // Replace this condition with your logic to check for unsaved changes

    //   if (contentState!=="unchanged") {
    //     save();
    //   }
    // };

    function getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }
    // Conditionally run the useEffect hook based on autoSaveEnabled

    useEffect(() => {
        if (autoSaveEnabled) {
            const intervalId = setInterval(() => {
                // Example usage
                const currentTime = getCurrentTime();
                // setContentState(contentState == "modified" ? "unchanged" : "modified")
                console.log(currentTime); // Outputs something like "12:34"
                console.log("INTERVAL")
                console.log(contentState)
                if (contentState !== "unchanged") {
                    save();
                }
            }, 20000); // 20 seconds = 20000

            // Clean up interval when the component is unmounted
            return () => clearInterval(intervalId);
        }
    }, [autoSaveEnabled, contentState]);


    const classes = useStyles();
    return (
        <div className={classes.layout}>
            <SaveButton onClick={save} status={status} />

            <div
                ref={containerRef}
                style={{ width: "100%", height: "calc(100vh - 64px)" }}
            />
        </div>
    );
}
// id="btn"
