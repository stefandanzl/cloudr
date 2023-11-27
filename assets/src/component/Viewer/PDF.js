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
import loadScript from "../../utils/loadScript";

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
    let instanceRef; // = useRef(null);
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


            // const arrayBuffer = await pdfInstance.exportPDF();
            const arrayBuffer = await pdfInstance.exportPDF();
            const blob = new Blob([arrayBuffer], { type: "application/pdf" });

            API.put("/file/update/" + query.get("id"), blob)
                .then(() => {
                    console.log("saved successfully!");
                    setStatus("success");
                    setTimeout(() => setStatus(""), 2000);
                })
                .catch((error) => {
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
        let PSPDFKit;    // LOCAL and WEB
        
        // const cdnBase = "https://cdn.danzl.it/pspdfkit/pspdfkit-2023.5.2/"                                  // WEB
        // const baseURL = cdnBase                                                                             // WEB
        // const scriptUrl = cdnBase + '/pspdfkit.js';                                                         // WEB
        // loadScript(scriptUrl).then                                                                          // WEB

        (async function () {                                                                                

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
                    type: "document-editor",
                    dropdownGroup: "doc",
                }, {
                type: "document-crop",
                dropdownGroup: "doc",
            }, {
                type: "export-pdf",
                dropdownGroup: "doc",
            }, {
                type: "print",
                dropdownGroup: "doc",
            }, {
                type: "zoom-out",
                dropdownGroup: "zoom",
            }, {
                type: "zoom-in",
                dropdownGroup: "zoom",
            }, {
                type: "zoom-mode",
                dropdownGroup: "zoom",
            }, {
                type: "search",
                dropdownGroup: "zoom",
            }, {
                type: "spacer"
            }, {
                type: "highlighter",
                title: "gelb",
                id: "gelb",
                dropdownGroup: "gelb",
            }, {
                type: "ink",
                dropdownGroup: "pen",
            }, {
                type: "ink-eraser",
                dropdownGroup: "rubber",
            }, {
                type: "text-highlighter",
                dropdownGroup: "hightext",
                selected: true,
            }, {
                type: "callout",
                dropdownGroup: "add",
            }, {
                type: "note",
                dropdownGroup: "add",
            }, {
                type: "text",
                dropdownGroup: "add",
            }, {
                type: "link",
                dropdownGroup: "add",
            }, {
                type: "image",
                dropdownGroup: "add",
            }, {
                type: "stamp",
                dropdownGroup: "add",
            }, {
                type: "line",
                dropdownGroup: "line",
                //selected: true,
            }, {
                type: "arrow",
                dropdownGroup: "line",
                //selected: true,
            }, {
                type: "rectangle",
                dropdownGroup: "line",
            }, {
                type: "polygon",
                dropdownGroup: "line",
            }, {
                type: "multi-annotations-selection",
                dropdownGroup: "multi",
            }, {
                type: "spacer"
            }, {
                type: "highlighter",
                dropdownGroup: "h1",
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



            // })

            const loadPdf = async () => {
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
                    })
                        .then(async (instance) => {
                            // instancer = instance;
                            // instanceRef = instance;
                            // idRef = query.get("id");
                            setPdfInstance(instance);
                            console.log("INSTANCEEE:", pdfInstance)

                            instance.addEventListener(
                                "document.saveStateChange",
                                async (event) => {
                                    console.log(
                                        `Save state changed: ${event.hasUnsavedChanges}`
                                    );
                                    //   console.log(props.id)
                                    // if (event.hasUnsavedChanges){save()}
                                }
                            );

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




                        }).catch((error) => {
                            console.error('PSPDFKit loading error:', error);
                        });

                    console.log("STRINGGGif", JSON.stringify(pdfInstance));
                } catch (error) {
                    console.error("Error loading PSPDFKit:", error);
                }
            };

            loadPdf();
        })();

        return () => {
            PSPDFKit && PSPDFKit.unload(container);
            // if (pdfInstance) {
            //   pdfInstance.destroy();
            // }
        };
        // PSPDFKit && ;
    }, []);

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
