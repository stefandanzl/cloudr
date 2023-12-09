/* global luckysheet */



// import React, { useEffect, useRef } from 'react';
import "./Sheet.css";
import React, { Suspense, useCallback, useEffect, useState, useRef } from "react";
import { Paper, useTheme } from "@material-ui/core";
import { useLocation, useParams, useRouteMatch } from "react-router";
import API from "../../middleware/Api";
import { useDispatch } from "react-redux";
import pathHelper from "../../utils/page";
import SaveButton from "../Dial/Save";
import { sheetSuffix } from "../../config";

import { toggleSnackbar } from "../../redux/explorer";
import UseFileSubTitle from "../../hooks/fileSubtitle";
import { useTranslation } from "react-i18next";

import LuckyExcel from "luckyexcel";

import { usePagination } from "../../hooks/pagination";
import { useSelector } from "react-redux";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function Luckysheet()  {
   // Flag to track whether the scripts are loaded
   const script1Loaded = useRef(false);
   const script2Loaded = useRef(false);
 
   
   const { t } = useTranslation();
   const [content, setContent] = useState("");
   const [status, setStatus] = useState("");
   const [loading, setLoading] = useState(true);
   const [suffix, setSuffix] = useState("sheet");
   const [wordWrap, setWordWrap] = useState("off");

   const match = useRouteMatch();
   const location = useLocation();
   const query = useQuery();
   const { id } = useParams();
   const theme = useTheme();
   const { title } = UseFileSubTitle(query, match, location);

   const dispatch = useDispatch();
   const ToggleSnackbar = useCallback(
       (vertical, horizontal, msg, color) =>
           dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
       [dispatch]
   );
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [luckysheetRef, setLuckysheetRef] = useState(null)

  const selected = useSelector((state) => state.explorer.selected);
  const path = useSelector((state) => state.navigator.path);
  const [contentState, setContentState] = useState("unchanged");

  const { dirList, fileList, startIndex } = usePagination();

  // Function to encode consecutive nulls with a custom placeholder
  function encodeNulls(inputString) {
    const searchString = 'null';
    const nextString = ',null';
    const placeholder = '~';
  
    let outputString = '';
    let count = 1;
  
    for (let i = 0; i < inputString.length; i++) {
      const currentSubstring = inputString.substr(i, searchString.length);
  
      if (currentSubstring === searchString) {
        let j = i + searchString.length;
  
        // Count consecutive occurrences
        while (inputString.substr(j, nextString.length) === nextString) {
          j += nextString.length;
          count++;
        }
  
        // Replace with a placeholder and count if count is greater than 1
        if (count > 1) {
          const replacement = `"~${count}~"`;
          outputString += replacement;
          i = j - 1; // Move the index to the end of the replacement
        } else {
          outputString += searchString;
          i+= searchString.length -1
        }
  
        count = 1; // Reset count for the next sequence
      } else {
        outputString += inputString[i];
      }
    }
  
    return outputString;
  }

  // Function to decode the custom placeholder to consecutive nulls
  function decodeNulls(inputString) {
    const regex = new RegExp(`"~(\\d+)~"`, 'g');
    return inputString.replace(regex, (_, count) => Array(Number(count) + 0).fill('null,').join('')).replaceAll(',]', ']').replaceAll(",,",",");
  }


  const save = async (id) => {
    if(!id){
        const id = query.get("id")
    }
    try {
        if (!luckysheetRef) {
            // Handle the case where pdfInstance is not available yet
            console.error("PDF instance not available.");
            return;
        }
        setContentState("saving")
        
        // const arrayBuffer = await pdfInstance.exportPDF();
        const sheetObject = await luckysheetRef.getAllSheets();
        const jsonString = JSON.stringify(sheetObject);
        const encodedJsonString = encodeNulls(jsonString);
        const blob = new Blob([encodedJsonString], { type: "application/json" });

        API.put("/file/update/" + id, blob)
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
        console.error("Error saving Sheet:", error);
    }
};

  const excelSaveSheet = () =>{
    
    
    if (!selected.length === 0) { 
        console.log("NOTHING SELECTED!")
        return}
    // if (!selected.length > 0) {
        const target = selected[0];
        const rawPath = target.path;
        // const basePath = rawPath.slice(1);
        const fileName = target.name;
        const sheetName = fileName.replace("xslx", "sheet")
        const filePath = path.join(rawPath, sheetName);
        console.log(filePath)
        // setUrl(filePath)

    //   }else {
    //     console.log("Nothing selected?"); 
    //     return
    // }
        // if (dirList.includes(sheetName)) {
        //     console.log(`${sheetName} is in the array.`);
        //   } else {
        //     console.log(`${sheetName} is not in the array.`);
        //   }
          
          const foundObject = dirList.find((item) => item.name === sheetName);
        //  const sheetFile = dirList.findIndex((value) => { return value.name === sheetName; })
    if (foundObject) {
        // this.props.toggleSnackbar( "top", "right", this.props.t("modals.duplicatedFolderName"), "warning" );
        // this.props.setModalsLoading(false);
        console.log(foundObject.id)
        save(foundObject.id)

    } else {
        API.post("/file/create", { path: (this.props.path === "/" ? "" : this.props.path) + "/" + this.state.newFileName, })
            .then(() => {
                const foundObject = dirList.find((item) => item.name === sheetName);
                if(foundObject){
                    save(foundObject.id)
                }
            })
            .catch((error) => {
                // this.props.setModalsLoading(false);
                this.props.toggleSnackbar( "top", "right", error.message, "error" );
            });
    }
  }

  

const saveProcess = () =>{
    if(suffix === "sheet"){
        save()
    } else if(suffix === "xlsx"){
        excelSaveSheet()
    } else {
        ToggleSnackbar("top", "right", "Suffix Error", "error");
    }
}

  // Include stylesheets directly in the head of the document
  useEffect(() => {
    const linkElement1 = document.createElement('link');
    linkElement1.rel = 'stylesheet';
    linkElement1.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/css/pluginsCss.css';
    document.head.appendChild(linkElement1);

    const linkElement2 = document.createElement('link');
    linkElement2.rel = 'stylesheet';
    linkElement2.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/plugins.css';
    document.head.appendChild(linkElement2);

    const linkElement3 = document.createElement('link');
    linkElement3.rel = 'stylesheet';
    linkElement3.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/css/luckysheet.css';
    document.head.appendChild(linkElement3);

    const linkElement4 = document.createElement('link');
    linkElement4.rel = 'stylesheet';
    linkElement4.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/assets/iconfont/iconfont.css';
    document.head.appendChild(linkElement4);

    // Add cleanup function to remove the link elements when the component unmounts
    return () => {
      document.head.removeChild(linkElement1);
      document.head.removeChild(linkElement2);
      document.head.removeChild(linkElement3);
      document.head.removeChild(linkElement4);
    };
  }, []); 

 
  useEffect(() => {
    // Load plugin.js script
    const scriptElement1 = document.createElement('script');
    scriptElement1.src = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/js/plugin.js';
    scriptElement1.type = 'text/javascript';
    scriptElement1.onload = () => {
      if (!script1Loaded.current) {
        // plugin.js script has loaded, now load luckysheet.umd.js script
        script1Loaded.current = true;
        console.log('plugin.js loaded');
        const scriptElement2 = document.createElement('script');
        scriptElement2.src = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/luckysheet.umd.js';
        scriptElement2.type = 'text/javascript';
        scriptElement2.onload = () => {
          if (!script2Loaded.current) {
            // Both scripts have loaded, now you can initialize Luckysheet
            script2Loaded.current = true;
            console.log('luckysheet.umd.js loaded');
            
            setScriptLoaded(true)
            // const luckysheet = window.luckysheet;
            // luckysheet.create({
            //   container: 'luckysheetDiv',
            // }); 
            
            // Add cleanup function to remove the script elements when the component unmounts
            return () => {
              document.head.removeChild(scriptElement1);
              document.head.removeChild(scriptElement2);
            };
          }
        };
        // Append luckysheet.umd.js script to head
        document.head.appendChild(scriptElement2);
      }
    };
    // Append plugin.js script to head
    document.head.appendChild(scriptElement1);
  }, []);




  useEffect(() => {
    const extension = title.split(".");
    console.log(extension)
    setSuffix(sheetSuffix[extension.pop()]);
    console.log(suffix)
    // eslint-disable-next-line
}, [title]);


// Failed to read file content: Cannot read properties of undefined (reading 'create')

useEffect(() => {
    if (scriptLoaded){

        const options = {
            data: [
                {
                    name: "Cell",
                    index: 0,
                    status: 1,
                    order: 0,
                    hide: 0,
                    row: 36,
                    column: 18,
                    defaultRowHeight: 19,
                    defaultColWidth: 73,
                    celldata: [],
                    config: {
                        merge: {},
                        rowlen: {},
                        columnlen: {},
                        rowhidden: {},
                        colhidden: {},
                        borderInfo: {},
                        authority: {},
                    },
                    scrollLeft: 0,
                    scrollTop: 315,
                    luckysheet_select_save: [],
                    calcChain: [],
                    isPivotTable: false,
                    pivotTable: {},
                    filter_select: {},
                    filter: null,
                    luckysheet_alternateformat_save: [],
                    luckysheet_alternateformat_save_modelCustom: [],
                    luckysheet_conditionformat_save: {},
                    frozen: {},
                    chart: [],
                    zoomRatio: 1,
                    image: [],
                    showGridLines: 1
                }
  
            ],
            
        }

    const luckysheet = window.luckysheet;
    setLuckysheetRef(luckysheet)
    let requestURL = "/file/content/" + query.get("id");
    if (pathHelper.isSharePage(location.pathname)) {
        requestURL = "/share/content/" + id;
        if (query.get("share_path") !== "") {
            requestURL +=
                "?path=" + encodeURIComponent(query.get("share_path"));
        }
    }

    setLoading(true);
    API.get(requestURL, { responseType: "arraybuffer" })
        .then((response) => {
            const buffer = new Buffer(response.rawData, "binary");
            
            if (suffix === "sheet"){
            const encodedTextdata = buffer.toString(); // for string
            const textdata = decodeNulls(encodedTextdata);
            setContent(textdata);
                luckysheet.create({
                container: "luckysheet",
                title: 'Luckysheet Cloudr', // set the name of the table
                data: [textdata],
                // plugins:['chart'],
                // showinfobar: false,
                ...options,
            })
            } else if (suffix === "xlsx"){
                LuckyExcel.transformExcelToLucky(buffer, function(exportJson, luckysheetfile){

                    if(exportJson.sheets==null || exportJson.sheets.length===0){
                        alert("Failed to read the content of the excel file, currently does not support xls files!");
                        return;
                    }
                    luckysheet.destroy();

                    luckysheet.create({
                        container: 'luckysheet', //luckysheet is the container id
                        showinfobar:false,
                        data:exportJson.sheets,
                        title:exportJson.info.name,
                        userInfo:exportJson.info.name.creator,
                        ...options,
                    });
                });

            } else {
                console.log("Unknown file format!");
            }
        })
        .catch((error) => {
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
            setLoading(false);
        });
    }
    // eslint-disable-next-line
}, [scriptLoaded,match.params[0]]);


  
  const luckyCss = {
    margin: '0px',
    padding: '0px',
    // position: 'absolute',
    width: "100%", 
    height: "calc(100vh - 64px)", 
    // width: '100%',
    // height: '100%',
    // left: '0px',
    // top: '0px',
    color: "black !important",
  };

  return (
    <>
    <SaveButton onClick={saveProcess} status={status} />
    <div id="luckysheetDiv" style={luckyCss}></div>
    </>
  )
}

