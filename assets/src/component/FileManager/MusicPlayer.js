import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    List,
    Slider,
    withStyles,
} from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MusicNote from "@material-ui/icons/MusicNote";
import PlayArrow from "@material-ui/icons/PlayArrow";
import PlayNext from "@material-ui/icons/SkipNext";
import PlayPrev from "@material-ui/icons/SkipPrevious";
import Pause from "@material-ui/icons/Pause";
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import { Repeat, RepeatOne, Shuffle } from "@material-ui/icons";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { audioPreviewSuffix } from "../../config";
import { baseURL } from "../../middleware/Api";
import * as explorer from "../../redux/explorer/reducer";
import pathHelper from "../../utils/page";
import {
    audioPreviewSetIsOpen,
    audioPreviewSetPlaying,
    showAudioPreview,
    triggerAudioLoad,
} from "../../redux/explorer";
import { withTranslation } from "react-i18next";
import MediaSession from '@mebtte/react-media-session';
import "./MusicPlayer.css"; // Import your CSS file for styling
import API from "../../middleware/Api";
import Auth from "../../middleware/Auth"



const styles = (theme) => ({
    list: {
        //maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        overflow: "auto",
        maxHeight: 300,
    },
    slider_root: {
        "vertical-align": "middle",
    },
});

const mapStateToProps = (state) => {
    return {
        first: state.explorer.audioPreview.first,
        other: state.explorer.audioPreview.other,
        isOpen: state.explorer.audioPreview.isOpen,
        playingName: state.explorer.audioPreview.playingName,
        trigger: state.explorer.audioPreview.trigger,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        showAudioPreview: (first) => {
            dispatch(showAudioPreview(first));
        },
        audioPreviewSetIsOpen: (first) => {
            dispatch(audioPreviewSetIsOpen(first));
        },
        audioPreviewSetPlaying: (playingName, paused) => {
            dispatch(audioPreviewSetPlaying(playingName, paused));
        },
        triggerAudioLoad: (trigger) => {
            dispatch(triggerAudioLoad(trigger));
        },
    };
};

class MusicPlayerComponent extends Component {
    constructor(props) {
        super(props);

        // Try to retrieve the selected speed from localStorage, or set a default value
        // const storedSpeed = localStorage.getItem('selectedSpeed');
        // const initialSpeed = storedSpeed ? parseFloat(storedSpeed) : 1.0;


        this.state = {
            items: [],
            currentIndex: 0,
            //isOpen: false,
            isPlay: true,
            currentTime: 0,
            duration: 0,
            progressText: "00:00/00:00",
            looptype: 0,
            selectedSpeed: 1.0,
            // New settings state
            // saveIntervalId: null,
            timeSaved: Date.now(),
            isSaving: false,
            audioSettings: {
                remainingTime: 120,
                speedFactor: 1,
                keepHistory: 20,
                saveInterval: 10,
                history: [],
                last: {},
                /** last: [
                     {
                         title: "",
                         status: "done",
                         path: "",
                         src: "",
                         id: "",   unverwendet
                         timestamp: 0, !!!
                     }
                 ]
         console.log(this.state.items[this.state.currentIndex])
         console.log(this.state.items[this.state.currentIndex]?.src)   = src
         console.log(this.state.items[this.state.currentIndex]?.title)  = title
         console.log(this.myAudioRef.current.currentTime)  
         */
            },
        };
        this.myAudioRef = React.createRef();


    }



    loadUserSettings = async () => {
        console.log("loadUserSettings");
        let response = null;

        // Get settings from API
        try {
            response = await API.get("/user/setting");
            console.log(response);
        } catch (error) {
            console.error('Failed to load audio settings:', error);
            return;
        }

        if (!("audio" in response.data)) {
            console.error("No 'audio' in response data.")
            return
        }
        if (!this.myAudioRef.current) {
            console.error("No myAudioRef.current")
            return
        }

        const audioSettings = response.data.audio;


        console.log("Conditions check:", JSON.stringify({
            hasAudioRef: !!this.myAudioRef.current,
            items: this.state.items?.length,
            hasCurrentItem: !!this.state.items[this.state.currentIndex],
            isInLast: audioSettings.last,
            hasHistory: !!audioSettings.history?.length
        }, null, 2));

        // // Only update settings if they're valid
        // if (audioSettings.keepHistory !== 0 && audioSettings.saveInterval !== 0) {
        //     this.setState({ audioSettings });
        // }

        // Update playback speed
        if ("speedFactor" in audioSettings) {
            const speed = audioSettings.speedFactor;
            this.setState({ selectedSpeed: speed });
            if (this.myAudioRef.current) {
                this.myAudioRef.current.playbackRate = speed;
            }
        }

        // Load history items if needed

        const index = audioSettings.history?.findIndex(item => item.src === audioSettings.last?.src);
        if (index !== -1) {
            audioSettings.history[index].timestamp = audioSettings.last.timestamp;
        }


        if (this.state.items?.length === 0) { //&& audioSettings.history?.length > 0) {
            console.log("SPECIAL items MODE");
            const items = [];

            audioSettings.history?.forEach(element => {
                items.push({
                    title: element.title,
                    src: element.src,
                });
            });



            await new Promise(resolve =>
                this.setState({
                    items,
                    currentIndex: 0,
                }, () => {
                    console.log('Items updated:', this.state.items);
                    resolve();
                })
            );
        }

        console.error(0)
        // Handle current item timestamp and history
        if (this.myAudioRef.current && this.state.items[this.state.currentIndex]) {
            console.error(1)
            const currentSrc = this.state.items[this.state.currentIndex].src;

            // Check last played first
            if (audioSettings.last?.src === currentSrc) {
                console.error(2)

                this.myAudioRef.current.currentTime = audioSettings.last.timestamp;
                this.setState({ audioSettings });
            }
            // Then check history
            else {
                console.error(3)
                let currentAudio = null
                let updatedHistory = null

                const historyItem = audioSettings.history?.find(item => item.src === currentSrc);

                if (historyItem) {
                    // Current Audio is in history
                    console.error(4)
                    this.myAudioRef.current.currentTime = historyItem.timestamp;
                    currentAudio = historyItem

                    updatedHistory = audioSettings.history.filter(item =>
                        item.src !== currentAudio.src
                    );

                } else {
                    // Current Audio is not in history
                    console.error(5)
                    currentAudio = {
                        title: this.state.items[this.state.currentIndex].title,
                        src: this.state.items[this.state.currentIndex].src,
                        timestamp: Math.round(this.myAudioRef.current.currentTime * 10) / 10,
                        status: "started",
                        total: this.myAudioRef.current?.duration,
                    }
                    updatedHistory = audioSettings.history;
                }

                updatedHistory = [currentAudio, ...updatedHistory]
                    .slice(0, audioSettings.keepHistory);

                console.log("Original History:", updatedHistory);
                console.log("Deduplicated History:", deduplicatedHistory);

                // remove duplicate objects
                const deduplicatedHistory = updatedHistory.filter((item, index) => {
                    return updatedHistory.findIndex(obj => obj.src === item.src) === index;
                });

                console.error(6)
                const updatedSettings = {
                    ...audioSettings,
                    last: currentAudio,
                    history: deduplicatedHistory,
                };
                this.setState({ audioSettings: updatedSettings });

                console.info("UPDATED SETTTTTTTTTTTTINGS")
                console.log(updatedSettings)

                try {
                    console.error(7)
                    await API.patch("/user/setting/audio", { audio: updatedSettings });

                } catch (error) {
                    console.error('Failed to save history update:', error);
                }

            }


        }
    };


    saveLastPosition = async () => {
        console.log("saveLastPosition");
        if (!this.myAudioRef.current || !this.state.items[this.state.currentIndex]) return;

        const currentAudio = this.state.items[this.state.currentIndex];
        let currentPosition = Math.round(this.myAudioRef.current.currentTime * 10) / 10
        const totalDuration = this.myAudioRef.current.duration;

        const remainingTime = totalDuration - currentPosition;

        if (remainingTime < this.state.audioSettings.saveInterval * 2) {
            currentPosition = 0;
        }

        const isListened = remainingTime <= this.state.audioSettings.remainingTime;

        const newItem = {
            title: currentAudio.title,
            status: isListened ? 'ended' : 'started',
            src: currentAudio.src,
            // speed: this.state.selectedSpeed,
            timestamp: currentPosition,
            total: totalDuration
        };

        const updatedSettings = {
            // ...this.state.audioSettings,
            last: newItem,
            speedFactor: Math.round(this.state.selectedSpeed * 10) / 10
        };

        try {
            await API.patch("/user/setting/audio", {
                audio: updatedSettings
            });
            this.setState({ audioSettings: updatedSettings });
        } catch (error) {
            console.error('Failed to save last position:', error);
        }
    };



    // async UNSAFE_componentWillMount() {
    //     await this.loadUserSettings();
    // }

    UNSAFE_componentWillReceiveProps = (nextProps) => {
        const items = [];
        let firstOne = 0;
        if (nextProps.first.id !== "") {
            if (pathHelper.isSharePage(this.props.location.pathname) && !nextProps.first.path) {
                const newItem = {
                    title: nextProps.first.name,
                    src: baseURL + "/share/preview/" + nextProps.first.key,
                };
                firstOne = 0;
                items.push(newItem);
                this.setState({
                    currentIndex: firstOne,
                    items: items,
                    //isOpen: true,
                });
                this.props.audioPreviewSetIsOpen(true);
                this.props.showAudioPreview(
                    explorer.initState.audioPreview.first
                );
                return;
            }
            // eslint-disable-next-line
            nextProps.other.map((value) => {
                const fileType = value.name.split(".").pop().toLowerCase();
                if (audioPreviewSuffix.indexOf(fileType) !== -1) {
                    let src = "";
                    if (pathHelper.isSharePage(this.props.location.pathname)) {
                        src = baseURL + "/share/preview/" + value.key;
                        src =
                            src +
                            "?path=" +
                            encodeURIComponent(
                                value.path === "/"
                                    ? value.path + value.name
                                    : value.path + "/" + value.name
                            );
                    } else {
                        src = baseURL + "/file/preview/" + value.id;
                    }
                    const newItem = {
                        title: value.name,
                        src: src,
                    };
                    if (
                        value.path === nextProps.first.path &&
                        value.name === nextProps.first.name
                    ) {
                        firstOne = items.length;
                    }
                    items.push(newItem);
                }
            });

            /*
            if (items.length === 0) {
                items = this.getItemsFromHistory()
            }
            */

            this.setState({
                currentIndex: firstOne,
                items: items,
                //isOpen: true,
            });
            this.props.audioPreviewSetIsOpen(true);
            this.props.showAudioPreview(explorer.initState.audioPreview.first);
        }
    };

    handleItemClick = (currentIndex) => () => {
        this.setState({
            currentIndex: currentIndex,
        });
    };

    handleClose = () => {
        /*this.setState({
            isOpen: false,
        });*/
        this.setState({
            currentIndex: -1,
        });
        this.pause();
        this.props.audioPreviewSetPlaying(null, false);
        this.props.audioPreviewSetIsOpen(false);
    };
    backgroundPlay = () => {
        this.props.audioPreviewSetIsOpen(false);
    };

    componentDidMount() {
        if (this.myAudioRef.current) {
            this.bindEvents(this.myAudioRef.current);
        }
    }

    componentDidUpdate(prevProps, prevState) {

        if (this.myAudioRef.current) {
            this.bindEvents(this.myAudioRef.current);
        }


        // // Check if dialog is being opened
        // if (!prevProps.isOpen && this.props.isOpen) {
        //     console.log("INIT Update")
        //     // Only initialize settings when the dialog is opened
        //     if (Auth.Check()) {
        //         this.loadUserSettings();
        //     }
        //     return
        // }
        // 
        // Check if dialog is being opened
        if (!prevProps.trigger && this.props.trigger) {
            console.log("TRIGGER Update")
            // Only initialize settings when the dialog is opened
            if (Auth.Check()) {
                this.loadUserSettings();
            }

        } else if (prevState.currentIndex !== this.state.currentIndex) {
            console.log("INDEX Update");
            if (Auth.Check()) {
                // Wait for audio to be ready before setting timestamp
                if (this.myAudioRef.current) {
                    this.myAudioRef.current.addEventListener('loadeddata', () => {
                        this.loadUserSettings();
                    }, { once: true }); // Use once: true to avoid multiple listeners
                }
            }
        }

    }


    componentWillUnmount() {
        this.unbindEvents(this.myAudioRef.current);
    }


    bindEvents = (ele) => {
        if (ele) {
            ele.addEventListener("canplay", this.readyPlay);
            ele.addEventListener("ended", this.loopnext);
            ele.addEventListener("timeupdate", this.timeUpdate);
        }
    };

    unbindEvents = (ele) => {
        if (ele) {
            ele.removeEventListener("canplay", this.readyPlay);
            ele.removeEventListener("ended", this.loopnext);
            ele.removeEventListener("timeupdate", this.timeUpdate);
        }
    };

    readyPlay = () => {
        // Set the playback rate on the audio element
        if (this.myAudioRef.current) {
            this.myAudioRef.current.playbackRate = this.state.selectedSpeed;
        }
        this.play();
    };

    formatTime = (s) => {
        if (isNaN(s)) return "00:00";
        const minute = Math.floor(s / 60);
        const second = Math.floor(s % 60);
        return (
            `${minute}`.padStart(2, "0") + ":" + `${second}`.padStart(2, "0")
        );
    };

    timeUpdate = async () => {
        const currentTime = Math.floor(this.myAudioRef.current.currentTime);

        // First update the UI-related state
        this.setState({
            currentTime: currentTime,
            duration: this.myAudioRef.current.duration,
            progressText: this.formatTime(currentTime) + "/" + this.formatTime(this.myAudioRef.current.duration),
        });

        // Then check if we need to save
        const shouldSave = Date.now() - this.state.timeSaved > (this.state.audioSettings.saveInterval || 10) * 1000;

        if (shouldSave && !this.state.isSaving) {

            try {
                console.log("Saving ...")
                // Set saving state first
                await new Promise(resolve => this.setState({ isSaving: true }, resolve));

                // Do the save
                await this.saveLastPosition();

                // Update both flags after successful save
                this.setState({
                    isSaving: false,
                    timeSaved: Date.now()
                });
            } catch (error) {
                // Make sure to clear saving state even if save fails
                this.setState({ isSaving: false });
                console.error('Failed to save position:', error);
            }
        }
    };

    play = () => {
        this.myAudioRef.current.play();
        this.setState({
            isPlay: true
        });
        this.props.audioPreviewSetPlaying(
            this.state.items[this.state.currentIndex]?.title,
            false
        );
        console.log(this.state.items[this.state.currentIndex])
        console.log(this.state.items[this.state.currentIndex]?.src)
        console.log(this.state.items[this.state.currentIndex]?.title)
        console.log(this.myAudioRef.current.currentTime)
        return true
    };

    pause = () => {
        if (this.myAudioRef.current) {
            this.myAudioRef.current.pause();
        }
        this.setState({
            isPlay: false
        })
        this.props.audioPreviewSetPlaying(
            this.state.items[this.state.currentIndex]?.title,
            true
        );
        return false
    };

    playOrPause = () => {
        if (this.state.isPlay) {
            this.pause();
        } else {
            this.play();
        }
    };
    changeLoopType = () => {
        let lt = this.state.looptype + 1;
        if (lt >= 3) {
            lt = 0;
        }
        this.setState({
            looptype: lt,
        });
    };
    loopnext = () => {
        let index = this.state.currentIndex;
        if (this.state.looptype == 0) {
            //all
            index = index + 1;
            if (index >= this.state.items.length) {
                index = 0;
            }
        } else if (this.state.looptype == 1) {
            //single
            //index=index;
        } else if (this.state.looptype == 2) {
            //random
            if (this.state.items.length <= 2) {
                index = index + 1;
                if (index >= this.state.items.length) {
                    index = 0;
                }
            } else {
                while (index == this.state.currentIndex) {
                    index = Math.floor(Math.random() * this.state.items.length);
                }
            }
        }
        if (this.state.currentIndex == index) {
            // this.myAudioRef.current.currentTime = 0;
            /**
             * This was removed because the progress shouldn't be lost!
             */
            this.play();
        }
        this.setState({
            currentIndex: index,
        });
    };

    prev = () => {
        let index = this.state.currentIndex - 1;
        if (index < 0) {
            index = this.state.items.length - 1;
        }
        this.setState({
            currentIndex: index,
        });

    };

    next = () => {
        let index = this.state.currentIndex + 1;
        if (index >= this.state.items.length) {
            index = 0;
        }
        this.setState({
            currentIndex: index,
        });

    };

    handleProgress = (e, newValue) => {
        this.myAudioRef.current.currentTime = newValue;
    };

    handleBackward = () => {
        this.myAudioRef.current.currentTime = this.myAudioRef.current.currentTime - 10;
    };

    handleForward = () => {
        this.myAudioRef.current.currentTime = this.myAudioRef.current.currentTime + 10;
    };


    handleSpeedChange = (newSpeed) => {
        this.setState({
            selectedSpeed: newSpeed,
        });

        // Save the selected speed to localStorage
        // localStorage.setItem('selectedSpeed', newSpeed.toString());

        if (this.myAudioRef.current) {
            this.myAudioRef.current.playbackRate = newSpeed;
        }
    };

    handleIncreaseSpeed = () => {
        const newSpeed = this.state.selectedSpeed + 0.1;
        this.handleSpeedChange(newSpeed);
    };

    handleDecreaseSpeed = () => {
        const newSpeed = this.state.selectedSpeed - 0.1;
        this.handleSpeedChange(newSpeed >= 0.1 ? newSpeed : 0.1);
    };

    handleInputChange = (event) => {
        const newSpeed = parseFloat(event.target.value);
        this.handleSpeedChange(isNaN(newSpeed) ? 1.0 : newSpeed);
    };

    render() {
        const { currentIndex, items } = this.state;
        const { isOpen, classes, t } = this.props;
        return (
            <Dialog
                open={isOpen}
                onClose={this.backgroundPlay}
                aria-labelledby="form-dialog-title"
                maxWidth="xs"
                fullWidth
                keepMounted
            >
                <DialogTitle id="form-dialog-title">
                    {t("fileManager.musicPlayer")}
                </DialogTitle>
                <DialogContent>
                    <List className={classes.list} dense
                        key={items.length} >
                        {items.map((value, idx) => {
                            const labelId = `label-${value.title}`;
                            return (
                                <ListItem
                                    key={value.src}
                                    dense
                                    button
                                    onClick={this.handleItemClick(idx)}
                                    selected={idx === currentIndex}
                                >
                                    <ListItemIcon>
                                        {idx === currentIndex ? (
                                            <PlayArrow />
                                        ) : (
                                            <MusicNote />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        id={labelId}
                                        primary={`${value.title}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                    <MediaSession
                        title={this.state.items[this.state.currentIndex]?.title} // not supported in Firefox
                        // artist={music.singers.join(',')}
                        album={this.state.items[this.state.currentIndex]?.src} // not supported in Firefox

                        onPlay={this.play}
                        onPause={this.pause}
                        onSeekBackward={this.handleBackward}
                        onSeekForward={this.handleForward}
                        onPreviousTrack={this.prev}
                        onNextTrack={this.next}
                    >
                        <audio
                            ref={this.myAudioRef}
                            src={items[currentIndex]?.src}
                            playbackRate={this.state.selectedSpeed}
                        />
                    </MediaSession>
                    <div style={{ "padding-top": 8 }} />
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                            <Slider
                                classes={{ root: classes.slider_root }}
                                value={this.state.currentTime}
                                onChange={this.handleProgress}
                                step={1}
                                min={0}
                                max={this.state.duration}
                                aria-labelledby="continuous-slider"
                            />
                        </Grid>
                        <Grid item>{this.state.progressText}</Grid>
                    </Grid>
                    <Grid
                        container
                        spacing={2}
                        justifyContent="center"
                        justify="center"
                    >
                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label=""
                                onClick={this.changeLoopType}
                            >
                                {this.state.looptype === 0 ? (
                                    <Repeat />
                                ) : this.state.looptype === 1 ? (
                                    <RepeatOne />
                                ) : (
                                    <Shuffle />
                                )}
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label=""
                                onClick={this.prev}
                            >
                                <PlayPrev />
                            </IconButton>
                        </Grid>

                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label="Replay 10 Seconds"
                                onClick={this.handleBackward}
                            >
                                <Replay10Icon />
                            </IconButton>
                        </Grid>

                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label=""
                                onClick={this.playOrPause}
                            >
                                {this.state.isPlay ? <PlayArrow /> : <Pause />}
                            </IconButton>
                        </Grid>

                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label="Forward 10 seconds"
                                onClick={this.handleForward}
                            >
                                <Forward10Icon />
                            </IconButton>
                        </Grid>

                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label=""
                                onClick={this.next}
                            >
                                <PlayNext />
                            </IconButton>
                        </Grid>

                        {/* <Grid item> 
                            <IconButton
                                edge="end"
                                aria-label=""
                                onClick={this.loadUserSettings}
                            >
                                <LowPriorityIcon />
                            </IconButton>
                        </Grid> */}

                    </Grid>
                    <div className="playback-speed-selector">
                        <button className="round-button" onClick={this.handleDecreaseSpeed}>
                            -
                        </button>
                        <input
                            type="text"
                            value={this.state.selectedSpeed.toFixed(1)}
                            onChange={this.handleInputChange}
                            className="speed-input"
                        />
                        <button className="round-button" onClick={this.handleIncreaseSpeed}>
                            +
                        </button>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose}>
                        {t("fileManager.closeAndStop")}
                    </Button>
                    <Button onClick={this.backgroundPlay}>
                        {t("fileManager.playInBackground")}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

MusicPlayerComponent.propTypes = {
    classes: PropTypes.object.isRequired,
};

const MusicPlayer = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(withRouter(withTranslation()(MusicPlayerComponent))));

export default MusicPlayer;
