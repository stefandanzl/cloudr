import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import cloudrApp, { initState as cloudrState } from "./index";
import { initState as viewUpdateState } from "../redux/viewUpdate/reducer";
import { initState as explorerState } from "../redux/explorer/reducer";

import { changeSubTitle, setSubtitle } from "../redux/viewUpdate/action";
import {
    addSelectedTargets,
    changeSortMethod,
    removeSelectedTargets,
    setDirList,
    setFileList,
    setLastSelect,
    setSelectedTarget,
    setShiftSelectedIds,
    setSortMethod,
    updateFileList,
} from "../redux/explorer/action";
import {
    applyThemes, changeContextMenu, changeViewMethod,
    closeAllModals, dragAndDrop, drawerToggleAction, navigateTo, navigateUp,
    openCompressDialog,
    openCopyDialog, openCreateFolderDialog,
    openDecompressDialog,
    openGetSourceDialog,
    openLoadingDialog, openMoveDialog, openMusicDialog,
    openRemoteDownloadDialog, openRemoveDialog, openRenameDialog, openResaveDialog, openShareDialog,
    openTorrentDownloadDialog,
    refreshFileList,
    refreshStorage,
    saveFile,
    searchMyFile,
    setModalsLoading, setNavigator, setNavigatorError, setNavigatorLoadingStatus, setSessionStatus, setShareUserPopover,
    setSiteConfig, setUserPopover,
    showImgPreivew, toggleDaylightMode,
    toggleSnackbar
} from "../redux/explorer";

const initState = {
    ...cloudrState,
    viewUpdate: viewUpdateState,
    explorer: explorerState,
};
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe("index reducer", () => {
    it("should return the initial state", () => {
        expect(cloudrApp(undefined, { type: "@@INIT" })).toEqual(initState);
    });

    it("should handle redux init", () => {
        expect(cloudrApp(undefined, { type: "@@redux/INIT" })).toEqual(
            initState
        );
    });

    it("should handle DRAWER_TOGGLE", () => {
        const openAction = drawerToggleAction(true);
        expect(cloudrApp(initState, openAction)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                open: true,
            },
        });

        const clossAction = drawerToggleAction(false);
        expect(cloudrApp(initState, clossAction)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                open: false,
            },
        });
    });

    it("should handle CHANGE_VIEW_METHOD", () => {
        const action = changeViewMethod("list");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                explorerViewMethod: "list",
            },
        });
    });

    it("should handle SET_SORT_METHOD", () => {
        const action = setSortMethod("sizeRes");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                sortMethod: "sizeRes",
            },
        });
    });

    describe("CHANGE_SORT_METHOD", () => {
        const explorerState = {
            fileList: [
                {
                    type: "file",
                    name: "b",
                    size: 10,
                    date: "2020/04/30",
                },
                {
                    type: "file",
                    name: "a",
                    size: 11,
                    date: "2020/05/01",
                },
                {
                    type: "file",
                    name: "z",
                    size: 110,
                    date: "2020/04/29",
                },
            ],
            dirList: [
                {
                    type: "dir",
                    name: "b_dir",
                    size: 10,
                    date: "2020/04/30",
                },
                {
                    type: "dir",
                    name: "a_dir",
                    size: 11,
                    date: "2020/05/01",
                },
                {
                    type: "dir",
                    name: "z_dir",
                    size: 110,
                    date: "2020/04/29",
                },
            ],
        };

        const state = {
            ...initState,
            explorer: {
                ...initState.explorer,
                ...explorerState,
            },
        };
        it("should handle sizePos", async () => {
            const action = changeSortMethod("sizePos");
            const sortFunc = (a, b) => {
                return a.size - b.size;
            };
            const fileList = explorerState.fileList;
            const dirList = explorerState.dirList;
            const store = mockStore(state);
            await store.dispatch(action);
            expect(store.getActions()).toEqual([
                setSortMethod("sizePos"),
                setDirList(dirList.sort(sortFunc)),
                setFileList(fileList.sort(sortFunc)),
            ]);
        });

        it("should handle sizeRes", async () => {
            const action = changeSortMethod("sizePos");
            const sortFunc = (a, b) => {
                return b.size - a.size;
            };
            const fileList = explorerState.fileList;
            const dirList = explorerState.dirList;
            const store = mockStore(state);
            await store.dispatch(action);
            expect(store.getActions()).toEqual([
                setSortMethod("sizePos"),
                setDirList(dirList.sort(sortFunc)),
                setFileList(fileList.sort(sortFunc)),
            ]);
        });

        it("should handle namePos", async () => {
            const action = changeSortMethod("namePos");
            const sortFunc = (a, b) => {
                return a.name.localeCompare(b.name);
            };
            const fileList = explorerState.fileList;
            const dirList = explorerState.dirList;
            const store = mockStore(state);
            await store.dispatch(action);
            expect(store.getActions()).toEqual([
                setSortMethod("namePos"),
                setDirList(dirList.sort(sortFunc)),
                setFileList(fileList.sort(sortFunc)),
            ]);
        });

        it("should handle nameRev", async () => {
            const action = changeSortMethod("nameRev");
            const sortFunc = (a, b) => {
                return b.name.localeCompare(a.name);
            };
            const fileList = explorerState.fileList;
            const dirList = explorerState.dirList;
            const store = mockStore(state);
            await store.dispatch(action);
            expect(store.getActions()).toEqual([
                setSortMethod("nameRev"),
                setDirList(dirList.sort(sortFunc)),
                setFileList(fileList.sort(sortFunc)),
            ]);
        });

        it("should handle timePos", async () => {
            const action = changeSortMethod("timePos");
            const sortFunc = (a, b) => {
                return Date.parse(a.date) - Date.parse(b.date);
            };
            const fileList = explorerState.fileList;
            const dirList = explorerState.dirList;
            const store = mockStore(state);
            await store.dispatch(action);
            expect(store.getActions()).toEqual([
                setSortMethod("timePos"),
                setDirList(dirList.sort(sortFunc)),
                setFileList(fileList.sort(sortFunc)),
            ]);
        });

        it("should handle timeRev", async () => {
            const action = changeSortMethod("timeRev");
            const sortFunc = (a, b) => {
                return Date.parse(b.date) - Date.parse(a.date);
            };
            const fileList = explorerState.fileList;
            const dirList = explorerState.dirList;
            const store = mockStore(state);
            await store.dispatch(action);
            expect(store.getActions()).toEqual([
                setSortMethod("timeRev"),
                setDirList(dirList.sort(sortFunc)),
                setFileList(fileList.sort(sortFunc)),
            ]);
        });
    });

    it("should handle CHANGE_CONTEXT_MENU", () => {
        const action1 = changeContextMenu("empty", false);
        expect(cloudrApp(initState, action1)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: false,
                contextType: "empty",
            },
        });
        const action2 = changeContextMenu("aa", true);
        expect(cloudrApp(initState, action2)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: true,
                contextType: "aa",
            },
        });
    });

    it("should handle DRAG_AND_DROP", () => {
        const action = dragAndDrop("source", "target");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                dndSignal: true,
                dndTarget: "target",
                dndSource: "source",
            },
        });
    });

    it("should handle SET_NAVIGATOR_LOADING_STATUE", () => {
        const action = setNavigatorLoadingStatus(true);
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                navigatorLoading: true,
            },
        });
    });

    it("should handle SET_NAVIGATOR_ERROR", () => {
        const action = setNavigatorError(true, "Error Message");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                navigatorError: true,
                navigatorErrorMsg: "Error Message",
            },
        });
    });

    describe("UPDATE_FILE_LIST", () => {
        const fileList = [
            {
                type: "file",
                name: "b",
                size: 10,
                date: "2020/04/30",
            },
            {
                type: "file",
                name: "a",
                size: 11,
                date: "2020/05/01",
            },
            {
                type: "file",
                name: "z",
                size: 110,
                date: "2020/04/29",
            },
        ];
        const dirList = [
            {
                type: "dir",
                name: "b_dir",
                size: 10,
                date: "2020/04/30",
            },
            {
                type: "dir",
                name: "a_dir",
                size: 11,
                date: "2020/05/01",
            },
            {
                type: "dir",
                name: "z_dir",
                size: 110,
                date: "2020/04/29",
            },
        ];
        const updateAction = updateFileList([...fileList, ...dirList]);
        it("should handle sizePos", async () => {
            const sortFun = (a, b) => {
                return a.size - b.size;
            };
            const state = {
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    sortMethod: "sizePos",
                },
            };
            const store = mockStore(state);
            await store.dispatch(updateAction);
            expect(store.getActions()).toEqual([
                setDirList(dirList.sort(sortFun)),
                setFileList(fileList.sort(sortFun)),
            ]);
        });

        it("should handle sizeRes", async () => {
            const sortFun = (a, b) => {
                return b.size - a.size;
            };
            const state = {
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    sortMethod: "sizeRes",
                },
            };
            const store = mockStore(state);
            await store.dispatch(updateAction);
            expect(store.getActions()).toEqual([
                setDirList(dirList.sort(sortFun)),
                setFileList(fileList.sort(sortFun)),
            ]);
        });

        it("should handle namePos", async () => {
            const sortFun = (a, b) => {
                return a.name.localeCompare(b.name);
            };
            const state = {
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    sortMethod: "namePos",
                },
            };
            const store = mockStore(state);
            await store.dispatch(updateAction);
            expect(store.getActions()).toEqual([
                setDirList(dirList.sort(sortFun)),
                setFileList(fileList.sort(sortFun)),
            ]);
        });

        it("should handle nameRev", async () => {
            const sortFun = (a, b) => {
                return b.name.localeCompare(a.name);
            };
            const state = {
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    sortMethod: "nameRev",
                },
            };
            const store = mockStore(state);
            await store.dispatch(updateAction);
            expect(store.getActions()).toEqual([
                setDirList(dirList.sort(sortFun)),
                setFileList(fileList.sort(sortFun)),
            ]);
        });

        it("should handle timePos", async () => {
            const sortFun = (a, b) => {
                return Date.parse(a.date) - Date.parse(b.date);
            };
            const state = {
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    sortMethod: "timePos",
                },
            };
            const store = mockStore(state);
            await store.dispatch(updateAction);
            expect(store.getActions()).toEqual([
                setDirList(dirList.sort(sortFun)),
                setFileList(fileList.sort(sortFun)),
            ]);
        });

        it("should handle timeRev", async () => {
            const sortFun = (a, b) => {
                return Date.parse(b.date) - Date.parse(a.date);
            };
            const state = {
                ...initState,
                viewUpdate: {
                    ...initState.viewUpdate,
                    sortMethod: "timeRev",
                },
            };
            const store = mockStore(state);
            await store.dispatch(updateAction);
            expect(store.getActions()).toEqual([
                setDirList(dirList.sort(sortFun)),
                setFileList(fileList.sort(sortFun)),
            ]);
        });
    });

    it("should handle SET_FILE_LIST", () => {
        const action = setFileList([
            {
                type: "file",
                id: "a",
            },
            {
                type: "file",
                id: "b",
            },
        ]);
        expect(
            cloudrApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        fileList: [{ type: "file", id: "test" }],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                fileList: [
                    {
                        type: "file",
                        id: "a",
                    },
                    {
                        type: "file",
                        id: "b",
                    },
                ],
            },
        });
    });

    it("should handle SET_DIR_LIST", () => {
        const action = setDirList([
            {
                type: "dir",
                id: "a",
            },
            {
                type: "dir",
                id: "b",
            },
        ]);
        expect(
            cloudrApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        dirList: [{ type: "dir", id: "test" }],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                dirList: [
                    {
                        type: "dir",
                        id: "a",
                    },
                    {
                        type: "dir",
                        id: "b",
                    },
                ],
            },
        });
    });

    it("should handle ADD_SELECTED_TARGETS", () => {
        const newSelect = [
            {
                type: "file",
            },
            {
                type: "dir",
            },
        ];
        const action = addSelectedTargets(newSelect);
        expect(
            cloudrApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        selected: [{ type: "file" }],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                selected: [{ type: "file" }, ...newSelect],
                selectProps: {
                    isMultiple: true,
                    withFolder: true,
                    withFile: true,
                },
            },
        });
    });

    it("should handle SET_SELECTED_TARGET", () => {
        const newSelect = [
            {
                type: "file",
            },
            {
                type: "dir",
            },
        ];
        const action = setSelectedTarget(newSelect);
        expect(
            cloudrApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        selected: [{ type: "file" }],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                selected: newSelect,
                selectProps: {
                    isMultiple: true,
                    withFolder: true,
                    withFile: true,
                },
            },
        });
    });

    it("should handle RMOVE_SELECTED_TARGETS", () => {
        const remove = ["1"];
        const action = removeSelectedTargets(remove);
        expect(
            cloudrApp(
                {
                    ...initState,
                    explorer: {
                        ...initState.explorer,
                        selected: [
                            { id: "1", type: "file" },
                            { id: "2", type: "file" },
                        ],
                    },
                },
                action
            )
        ).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                selected: [{ id: "2", type: "file" }],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: true,
                },
            },
        });
    });

    it("should handle NAVIGATOR_TO", async () => {
        const store = mockStore(initState);
        const action = navigateTo("/somewhere");
        await store.dispatch(action);
        expect(store.getActions()).toEqual([setNavigator("/somewhere", true)]);
    });

    it("should handle NAVIGATOR_UP", async () => {
        const navState = {
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/to/somewhere",
            },
        };
        const store = mockStore(navState);
        const action = navigateUp();
        await store.dispatch(action);
        expect(store.getActions()).toEqual([setNavigator("/to", true)]);
    });

    it("should handle SET_NAVIGATOR", () => {
        const navState = {
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/to/somewhere",
            },
        };
        const action = setNavigator("/newpath", true);
        expect(cloudrApp(navState, action)).toEqual({
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/newpath",
            },
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: false,
                navigatorError: false,
                navigatorLoading: true,
            },
            explorer: {
                ...initState.explorer,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                },
                keywords: "",
            },
        });
        expect(window.currntPath).toEqual("/newpath");
    });

    it("should handle TOGGLE_DAYLIGHT_MODE", () => {
        const action = toggleDaylightMode();
        const darkState = {
            ...initState,
            siteConfig: {
                ...initState.siteConfig,
                theme: {
                    ...initState.siteConfig.theme,
                    palette: {
                        ...initState.siteConfig.theme.palette,
                        type: "dark",
                    },
                },
            },
        };
        const lightState = {
            ...initState,
            siteConfig: {
                ...initState.siteConfig,
                theme: {
                    ...initState.siteConfig.theme,
                    palette: {
                        ...initState.siteConfig.theme.palette,
                        type: "light",
                    },
                },
            },
        };
        expect(cloudrApp(initState, action)).toEqual(darkState);
        expect(cloudrApp(darkState, action)).toEqual(lightState);
    });

    it("should handle APPLY_THEME", () => {
        const action = applyThemes("foo");
        const stateWithThemes = {
            ...initState,
            siteConfig: {
                ...initState.siteConfig,
                themes: JSON.stringify({ foo: "bar" }),
            },
        };
        expect(cloudrApp(stateWithThemes, action)).toEqual({
            ...stateWithThemes,
            siteConfig: {
                ...stateWithThemes.siteConfig,
                theme: "bar",
            },
        });
    });

    it("should handle OPEN_CREATE_FOLDER_DIALOG", () => {
        const action = openCreateFolderDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    createNewFolder: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_RENAME_DIALOG", () => {
        const action = openRenameDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    rename: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_REMOVE_DIALOG", () => {
        const action = openRemoveDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    remove: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_MOVE_DIALOG", () => {
        const action = openMoveDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    move: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_RESAVE_DIALOG", () => {
        const action = openResaveDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    resave: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle SET_USER_POPOVER", () => {
        // TODO: update to real anchor
        const action = setUserPopover("anchor");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                userPopoverAnchorEl: "anchor",
            },
        });
    });

    it("should handle SET_SHARE_USER_POPOVER", () => {
        // TODO: update to real anchor
        const action = setShareUserPopover("anchor");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                shareUserPopoverAnchorEl: "anchor",
            },
        });
    });

    it("should handle OPEN_SHARE_DIALOG", () => {
        // TODO: update to real anchor
        const action = openShareDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    share: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle SET_SITE_CONFIG", () => {
        // TODO: update to real anchor
        const action = setSiteConfig({ foo: "bar" });
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            siteConfig: {
                foo: "bar",
            },
        });
    });

    it("should handle SET_SITE_CONFIG", () => {
        // TODO: update to real anchor
        const action = setSiteConfig({ foo: "bar" });
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            siteConfig: {
                foo: "bar",
            },
        });
    });

    it("should handle OPEN_MUSIC_DIALOG", () => {
        const action = openMusicDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    music: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_REMOTE_DOWNLOAD_DIALOG", () => {
        const action = openRemoteDownloadDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    remoteDownload: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_TORRENT_DOWNLOAD_DIALOG", () => {
        const action = openTorrentDownloadDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    torrentDownload: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_DECOMPRESS_DIALOG", () => {
        const action = openDecompressDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    decompress: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_COMPRESS_DIALOG", () => {
        const action = openCompressDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    compress: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_GET_SOURCE_DIALOG", () => {
        const action = openGetSourceDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    getSource: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_COPY_DIALOG", () => {
        const action = openCopyDialog();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    copy: true,
                },
                contextOpen: false,
            },
        });
    });

    it("should handle OPEN_LOADING_DIALOG", () => {
        const action = openLoadingDialog("loading");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    loading: true,
                    loadingText: "loading",
                },
                contextOpen: false,
            },
        });
    });

    it("should handle CLOSE_ALL_MODALS", () => {
        const action = closeAllModals();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modals: {
                    ...initState.viewUpdate.modals,
                    createNewFolder: false,
                    rename: false,
                    move: false,
                    remove: false,
                    share: false,
                    music: false,
                    remoteDownload: false,
                    torrentDownload: false,
                    getSource: false,
                    resave: false,
                    copy: false,
                    loading: false,
                    compress: false,
                    decompress: false,
                },
            },
        });
    });

    it("should handle CHANGE_SUB_TITLE", async () => {
        const store = mockStore(initState);
        const action = changeSubTitle("test sub title");
        await store.dispatch(action);
        expect(store.getActions()).toEqual([setSubtitle("test sub title")]);
        expect(document.title).toEqual("test sub title - Cloudr");
    });

    it("should handle SET_SUBTITLE", () => {
        const action = setSubtitle("test sub title 2");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                subTitle: "test sub title 2",
            },
        });
    });

    it("should handle TOGGLE_SNACKBAR", () => {
        const action = toggleSnackbar(
            "top",
            "right",
            "something wrong",
            "error"
        );
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                snackbar: {
                    toggle: true,
                    vertical: "top",
                    horizontal: "right",
                    msg: "something wrong",
                    color: "error",
                },
            },
        });
    });

    it("should handle SET_MODALS_LOADING", () => {
        const action = setModalsLoading("test loading status");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                modalsLoading: "test loading status",
            },
        });
    });

    it("should handle SET_SESSION_STATUS", () => {
        const action = setSessionStatus(true);
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                isLogin: true,
            },
        });
    });

    it("should handle REFRESH_FILE_LIST", () => {
        const action = refreshFileList();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            navigator: {
                ...initState.navigator,
                refresh: false,
            },
            explorer: {
                ...initState.explorer,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                },
            },
        });
    });

    it("should handle SEARCH_MY_FILE", () => {
        const action = searchMyFile("keyword");
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            navigator: {
                ...initState.navigator,
                path: "/搜索结果",
                refresh: true,
            },
            viewUpdate: {
                ...initState.viewUpdate,
                contextOpen: false,
                navigatorError: false,
                navigatorLoading: true,
            },
            explorer: {
                ...initState.explorer,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                },
                keywords: "keyword",
            },
        });
    });

    it("should handle SHOW_IMG_PREIVEW", () => {
        const action = showImgPreivew({ type: "file" });
        const showImgState = {
            ...initState,
            explorer: {
                ...initState.explorer,
                fileList: [{ type: "file" }, { type: "dir" }],
            },
        };
        expect(cloudrApp(showImgState, action)).toEqual({
            ...showImgState,
            explorer: {
                ...showImgState.explorer,
                imgPreview: {
                    ...showImgState.explorer.imgPreview,
                    first: { type: "file" },
                    other: [{ type: "file" }, { type: "dir" }],
                },
            },
        });
    });

    it("should handle REFRESH_STORAGE", () => {
        const action = refreshStorage();

        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            viewUpdate: {
                ...initState.viewUpdate,
                storageRefresh: true,
            },
        });
    });

    it("should handle SAVE_FILE", () => {
        const action = saveFile();
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                fileSave: true,
            },
        });
    });

    it("should handle SET_LAST_SELECT", () => {
        const action = setLastSelect({ type: "file" }, 1);
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                lastSelect: {
                    file: { type: "file" },
                    index: 1,
                },
            },
        });
    });

    it("should handle SET_SHIFT_SELECTED_IDS", () => {
        const action = setShiftSelectedIds(["1", "2"]);
        expect(cloudrApp(initState, action)).toEqual({
            ...initState,
            explorer: {
                ...initState.explorer,
                shiftSelectedIds: ["1", "2"],
            },
        });
    });
});
