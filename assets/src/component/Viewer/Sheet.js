import LuckyExcel from "luckyexcel";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { Paper, useTheme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useLocation, useParams, useRouteMatch } from "react-router";
import API from "../../middleware/Api";
import { useDispatch } from "react-redux";
import pathHelper from "../../utils/page";
import SaveButton from "../Dial/Save";
import { codePreviewSuffix } from "../../config";
import TextLoading from "../Placeholder/TextLoading";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { toggleSnackbar } from "../../redux/explorer";
import UseFileSubTitle from "../../hooks/fileSubtitle";
import { useTranslation } from "react-i18next";

import 'luckysheet/dist/plugins/css/pluginsCss.css';
import 'luckysheet/dist/plugins/plugins.css';
import 'luckysheet/dist/css/luckysheet.css';
import 'luckysheet/dist/assets/iconfont/iconfont.css';
import luckysheet from 'luckysheet';

// const SheetEditor = React.lazy(() =>
//     import(/* webpackChunkName: "codeEditor" */ "react-monaco-editor")
// );

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

// const luckysheet = window.luckysheet;

export default function Sheet() {

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
   
   
   
   
   /*
    useEffect(() => {
        api().then(res => {
            luckysheet.create({
                container: "luckysheet",
                title: 'Luckysheet sphinx Demo', // set the name of the table
                data: [res],
                // plugins:['chart'],
                showinfobar: false
            })
        }).catch(error => {
            console.log(error);
        })
    }, [])
    */
    useEffect(() => {
        const extension = title.split(".");
        setSuffix(codePreviewSuffix[extension.pop()]);
        // eslint-disable-next-line
    }, [title]);


// Failed to read file content: Cannot read properties of undefined (reading 'create')

    useEffect(() => {
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
                const textdata = buffer.toString(); // for string
                setContent(textdata);
                    luckysheet.create({
                    container: "luckysheet",
                    title: 'Luckysheet Cloudr', // set the name of the table
                    data: [textdata],
                    // plugins:['chart'],
                    showinfobar: false
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
                            userInfo:exportJson.info.name.creator
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
        // eslint-disable-next-line
    }, [match.params[0]]);


    const luckyCss = {
        margin: '0px',
        padding: '0px',
        position: 'absolute',
        width: '100%',
        height: "100%",   //"calc(100vh - 198px)",
        left: '0px',
        top: '50px'
    }
    return (
        
        
        <div>
            <input type={"file"} onChange={(event) => {
                const files = event.target.files
                LuckyExcel.transformExcelToLucky(files[0], function(exportJson, luckysheetfile){

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
                        userInfo:exportJson.info.name.creator
                    });
                });
            }}/>
            <div
                id="luckysheet"
                style={luckyCss}
            />
        </div>
    );
}
