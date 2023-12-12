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
import { useTranslation } from "react-i18next";
// import PdfViewerComponent from "./PdfViewerComponent";
import SaveButton from "../Dial/Save";
import API from "../../middleware/Api";
import { Eraser } from "mdi-material-ui";
// import { PDFDocument } from 'pdf-lib'
import "./PDF.css"

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

    const { t } = useTranslation();
    const match = useRouteMatch();
    const location = useLocation();
    const query = useQuery();
    const { id } = useParams();

    const $vm = React.createRef();
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);

  
    const [pdfInstance, setPdfInstance] = useState(null);
    const [contentState, setContentState] = useState("unchanged");
    const [pdfState, setPdfState] = useState(true);
    const [pdfSettings, setPdfSettings] = useState({ autoSave: true, autoSaveInterval: 10, changePrompt: true, saveButton: true, pagesId: "" })
    
    const [pageNumber, setPageNumber] = useState(0);
    const [pageDB, setPageDB ] = useState({})
    const { title, path } = UseFileSubTitle(query, match, location);
    const [fetchSettings, setFetchSettings ] = useState(true);
    const [pageInit, setPageInit] = useState(true);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    /* useEffect(()=>{
     // const getSettings = () => {
         if (this.state.settings.two_factor) {
             this.setState({ twoFactor: true });
             return;
         }
         API.get("/user/setting/pdf")
             .then((response) => {
                 setPdfSettings(response)
                 // this.setState({
                 //     two_fa_secret: response.data,
                 //     twoFactor: true,
                 // });
             })
             .catch((error) => {
                console.log("Error getting setting 'pdf'")
                ToggleSnackbar("top", "right", error.message, "error");
                 // this.props.toggleSnackbar(
                 //     "top",
                 //     "right",
                 //     error.message,
                 //     "error"
                 // );
             });
     // };
         },[]); */
   /*      useEffect(() => {
            if (!pathHelper.isSharePage(location.pathname)) {
                const path = query.get("p").split("/");
                setPath(query.get("p"));
                SetSubTitle(path[path.length - 1]);
                setTitle(path[path.length - 1]);
            } else {
                SetSubTitle(query.get("name"));
                setTitle(query.get("name"));
                setPath(query.get("share_path"));
            }
            // eslint-disable-next-line
        }, [math.params[0], location]);
*/
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

    const savePageData = async () => {
        try {
            const objArray = pageDB
            if (pageNumber > 1){
                
                objArray[0].i = pageNumber;
                
                setPageDB(objArray)   

                console.log("pagesId pageDB was updated",getCurrentTime())
            }

                // This code will run after the state has been updated
                const content = JSON.stringify(objArray, null, 2)
                await API.put("/file/update/" + pdfSettings.pagesId, content )
               
                    console.log("uploaded pageDB successfully",getCurrentTime())
                    return true
                
                
            } catch(error){ 
                    console.log("ERRROR uploading pageDB", error.message,getCurrentTime())
                    ToggleSnackbar("top", "right", "Saving PageData failed", "error");
                    return false
                }
    }    

    const save = async () => {
        
        console.log("SAVE FUNCTION START",getCurrentTime())
        if (contentState === "saving"){return}
        try {
            if (!pdfInstance) {
                // Handle the case where pdfInstance is not available yet
                console.log("PDF instance not available.",getCurrentTime());
                return;
            }
            
            let savePageDataSuccess = false;
            if (pdfSettings.pagesId){
                console.log("pagesId exists")       
                
                savePageDataSuccess = await savePageData()
                
            }

            if (contentState !== "modified"){ 
                if(savePageDataSuccess){
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
                    console.log("saved successfully!",getCurrentTime());
                    setStatus("success");
                    setTimeout(() => setStatus(""), 2000);
                })
                .catch((error) => {
                    console.log("upload PDF fail", getCurrentTime())
                    setContentState((prev) => { return "modified" });
                    console.log("saved failed!",getCurrentTime());
                    setStatus("");
                    ToggleSnackbar("top", "right", error.message, "error");
                });
        } catch (error) {
            console.error("Error exporting PDF:", error,getCurrentTime());
        }
        
    };

    useEffect(()=>{
        if ( pageInit && pdfInstance && pageDB){
            setPageInit(false)
            if(pageNumber )
            
            pdfInstance.setViewState(v => v.set("currentPageIndex", pageNumber));
        }
    
    },[pageInit, pdfInstance, pageNumber, pageDB])

    useEffect(()=>{

        if( fetchSettings ){
            setFetchSettings(false);
            (async function () { 
        API.get("/user/setting").then((response)=>{
            
            const pagesId = response.data.pdf.pagesId

            setPdfSettings({
                autoSave: response.data.pdf.autoSave, 
                autoSaveInterval: response.data.pdf.autosaveInterval, 
                changePrompt: response.data.pdf.changePrompt, 
                saveButton: response.data.pdf.saveButton, 
                pagesId,
            })

            if(pagesId){

                API.get("/file/content/" + pagesId, { responseType: "arraybuffer" })
            .then((response) => {
                const buffer = new Buffer(response.rawData, "binary");
                const textdata = buffer.toString(); // for string
                
                console.log("TEXTDATA: ",textdata)
                
                let objArray;
                try{
                    objArray = JSON.parse(textdata)

                    if (Array.isArray(objArray)) {
                        // objArray is a valid array
                        console.log("It's an array:", objArray);


                        const arrayIndex = objArray.findIndex(obj => obj.id === query.get("id"))
                        if (arrayIndex !== -1){
                            const foundObject = objArray[arrayIndex];
                            
                            if (Number.isInteger(foundObject.i)){
                                // index = foundObject.i
                                setPageNumber(foundObject.i)
                            } else {
                                foundObject.i = 0;
                            }
                             
                            foundObject.p = query.get("p")
                            objArray.splice(arrayIndex, 1);
                            objArray.unshift(foundObject)
                            
        
                        } else {

                            console.log("PDF Document not yet in pagesDB")

                            const newObj = {
                                id: query.get("id"),
                                i: 0,
                                p: query.get("p"),
                            }
                            objArray.unshift(newObj)
                        }


                    } else {
                        // objArray is not an array
                        console.log("It's not an array! Previous data stored as dumpDB");

                        throw new Error("It's not an array! Previous data stored as dumpDB");
                        // objArray = [
                        //     { 
                        //     id: query.get("id"),
                        //     i: 0,
                        //     p: query.get("p"),
                        // }, 
                        // {dumpDB: textdata}
                    // ]
                    }
                } catch (error) {
                    console.log("Invalid JSON in pages file!")
                    console.log(error.message)

                    objArray = [
                        { 
                        id: query.get("id"),
                        i: 0,
                        p: query.get("p"),
                    }, 
                    {dumpDB: textdata}
                ]
                }

                console.log("ULTIMATE ARRAY: ",objArray)
                setPageDB(objArray)

                    })
            .catch((error) => {
                console.log(error.message)   // r[G.get(...)] is undefined
                ToggleSnackbar(
                    "top",
                    "right",
                    t("fileManager.errorReadFileContent", {
                        msg: error.message,
                    }),
                    "error"
                );
            })
            .then(() => {
                // setLoading(false);
            });
           
        }
        }).catch((error) => {
            console.log(error.message)
                ToggleSnackbar(
                    "top",
                    "right",
                    t("fileManager.errorReadFileContent", {
                        msg: error.message,
                    }),
                    "error"
                );
            })
        
    })();}
    },[pdfSettings, pageNumber, pageDB, title, path])



    //  Immediately invoked function expression (async function () {  })();

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

            (async function () {
                const baseURL = "https://cdn.danzl.it/pspdfkit/pspdfkit-2023.5.2/"                                      // WEB
                // const baseURL = `${window.location.protocol}//${window.location.host}/${process.env.PUBLIC_URL}`      // LOCAL                                                      
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
                        id: "m-hide",         // mobile hide
                        mediaQueries: ["max-width: 600px"],
                        // icon: "https://example.com/icon.png",
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

                const document = getBaseURL() +
                    (pathHelper.isSharePage(location.pathname)
                        ? "/share/preview/" +
                        id +
                        (query.get("share_path") !== ""
                            ? "?path=" +
                            encodeURIComponent(query.get("share_path"))
                            : "")
                        : "/file/preview/" + query.get("id"))



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
                            console.log("INSTANCEEE:", pdfInstance)


                            if (pageNumber) {
                                instance.setViewState(v => v.set("currentPageIndex", pageNumber));
                            }

                            instance.addEventListener("viewState.currentPageIndex.change", page => {
                                setPageNumber(page)

                            });

                            // function createGoToAction(pageIndex) {
                            //     return new PSPDFKit.Actions.GoToAction({ pageIndex });
                            //   }

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
                            instance.addEventListener("annotations.delete", deletedAnnotations  => {
                                setContentState((prev) => { return "modified" });
                                console.log("deletedAnnotations ", deletedAnnotations );
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

            // document.then(async (doc) => { pdfInstance.load({document: doc})})

            return () => {
                PSPDFKit && PSPDFKit.unload(container);
                if (pdfInstance) {
                    pdfInstance.destroy();
                }
            };
        }

        // PSPDFKit && ;
    }, [pdfState, contentState, pageNumber, pdfSettings]);


    useEffect(() => {

        if (pdfSettings.changePrompt) {
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
        }
        // eslint-disable-line 
        //   return () => {};
    }, [pdfSettings, contentState])



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
                if (contentState !== "unchanged") {
                    save();
                }
            }, 1000 * pdfSettings.autoSaveInterval); // 20 seconds = 20000

            // Clean up interval when the component is unmounted
            return () => clearInterval(intervalId);
        }
    }, [pdfSettings, contentState]);


    const classes = useStyles();
    return (
        <div className={classes.layout}>
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
