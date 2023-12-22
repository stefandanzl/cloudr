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
} from "../../redux/explorer";
import { withTranslation } from "react-i18next";

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
    };
};

class MusicPlayerComponent extends Component {
    state = {
        items: [],
        currentIndex: 0,
        //isOpen: false,
        //isPlay:false,
        currentTime: 0,
        duration: 0,
        progressText: "00:00/00:00",
        looptype: 0,
    };
    myAudioRef = React.createRef();


///////////////////


// playAudio() {
//   audio.src = playlist[index].src;
//   audio.play()
//   .then(_ => updateMetadata())
//   .catch(error => log(error));
// }

// updateMetadata() {
//   let track = playlist[index];

//   log('Playing ' + track.title + ' track...');
//   navigator.mediaSession.metadata = new MediaMetadata({
//     title: track.title,
//     artist: track.artist,
//     album: track.album,
//     artwork: track.artwork
//   });

//   // Media is loaded, set the duration.
//   updatePositionState();
// }

/* Position state (supported since Chrome 81) */

// updatePositionState() {
//   if ('setPositionState' in navigator.mediaSession) {
//     log('Updating position state...');
//     navigator.mediaSession.setPositionState({
//       duration: audio.duration,
//       playbackRate: audio.playbackRate,
//       position: audio.currentTime
//     });
//   }
// }


setMediaHandlers(){
/* Previous Track & Next Track */

navigator.mediaSession.setActionHandler('previoustrack', function() {
  console.log('> User clicked "Previous Track" icon.');
  this.prev()
});

navigator.mediaSession.setActionHandler('nexttrack', function() {
  console.log('> User clicked "Next Track" icon.');
  this.next()
});

// audio.addEventListener('ended', function() {
//   // Play automatically the next track when audio ends.
//   index = (index - 1 + playlist.length) % playlist.length;
//   this.play();
// });

/* Seek Backward & Seek Forward */

const defaultSkipTime = 10; /* Time to skip in seconds by default */

navigator.mediaSession.setActionHandler('seekbackward', function(event) {
  console.log('> User clicked "Seek Backward" icon.');
//   const skipTime = event.seekOffset || defaultSkipTime;
//   audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
//   updatePositionState();
});

navigator.mediaSession.setActionHandler('seekforward', function(event) {
  console.log('> User clicked "Seek Forward" icon.');
//   const skipTime = event.seekOffset || defaultSkipTime;
//   audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration);
//   updatePositionState();
});

/* Play & Pause */

navigator.mediaSession.setActionHandler('play', async function() {
  console.log('> User clicked "Play" icon.');
  this.play();
  // Do something more than just playing audio...
});

navigator.mediaSession.setActionHandler('pause', function() {
  console.log('> User clicked "Pause" icon.');
  this.pause();
  // Do something more than just pausing audio...
});

// audio.addEventListener('play', function() {
//   navigator.mediaSession.playbackState = 'playing';
// });

// audio.addEventListener('pause', function() {
//   navigator.mediaSession.playbackState = 'paused';
// });

/* Stop (supported since Chrome 77) */

try {
  navigator.mediaSession.setActionHandler('stop', function() {
    console.log('> User clicked "Stop" icon.');
    // TODO: Clear UI playback...
  });
} catch(error) {
  console.log('Warning! The "stop" media session action is not supported.');
}

/* Seek To (supported since Chrome 78) */

try {
  navigator.mediaSession.setActionHandler('seekto', function(event) {
    console.log('> User clicked "Seek To" icon.');
    // if (event.fastSeek && ('fastSeek' in audio)) {
    //   audio.fastSeek(event.seekTime);
    //   return;
    // }
    // audio.currentTime = event.seekTime;
    // updatePositionState();
  });
} catch(error) {
  console.log('Warning! The "seekto" media session action is not supported.');
}
}

////////////////////


    setMediaSession = () => {
        if ('mediaSession' in navigator) {
            // eslint-disable-next-line no-undef
            navigator.mediaSession.metadata = new MediaMetadata({
                title: this.state.explorer.audioPreview.playingName,
                artist: 'Artist Name',
                album: 'Album Name',
                // artwork: [
                //     { src: 'cover.jpg', sizes: '96x96', type: 'image/jpeg' },
                //     // Add more artwork sizes if needed
                // ],
            });

            navigator.mediaSession.setActionHandler('play', this.play);
            navigator.mediaSession.setActionHandler('pause', this.pause);
            navigator.mediaSession.setActionHandler('previoustrack', this.prev);
            navigator.mediaSession.setActionHandler('nexttrack', this.next);
        }
    };

    removeMediaSession = () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
        }
    };

    UNSAFE_componentWillReceiveProps = (nextProps) => {
        const items = [];
        let firstOne = 0;
        if (nextProps.first.id !== "") {
            if (
                pathHelper.isSharePage(this.props.location.pathname) &&
                !nextProps.first.path
            ) {
                const newItem = {
                    intro: nextProps.first.name,
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
                        intro: value.name,
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

            // // Set up Media Session API
            // this.setMediaSession();

            // Add "play" event listener
            this.myAudioRef.current.addEventListener("play", this.handlePlay);
        }
    }
    componentDidUpdate() {
        if (this.myAudioRef.current) {
            this.bindEvents(this.myAudioRef.current);

            // // Set up Media Session API
            // this.setMediaSession();

            // Add "play" event listener
            this.myAudioRef.current.addEventListener("play", this.handlePlay);
        }
    }
    componentWillUnmount() {
        this.unbindEvents(this.myAudioRef.current);

        // // Remove Media Session API setup
        // this.removeMediaSession();

        // Remove "play" event listener
        this.myAudioRef.current.removeEventListener("play", this.handlePlay);
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

    timeUpdate = () => {
        const currentTime = Math.floor(this.myAudioRef.current.currentTime); //this.myAudioRef.current.currentTime;//
        this.setState({
            currentTime: currentTime,
            duration: this.myAudioRef.current.duration,
            progressText:
                this.formatTime(currentTime) +
                "/" +
                this.formatTime(this.myAudioRef.current.duration),
        });
    };

    play = () => {
        this.myAudioRef.current.play();
        /*this.setState({
            isPlay: true
        });*/
        this.props.audioPreviewSetPlaying(
            this.state.items[this.state.currentIndex].intro,
            false
        );
        navigator.mediaSession.playbackState = 'playing';
    };

    pause = () => {
        if (this.myAudioRef.current) {
            this.myAudioRef.current.pause();
        }
        /*this.setState({
            isPlay: false
        })*/
        this.props.audioPreviewSetPlaying(
            this.state.items[this.state.currentIndex]?.intro,
            true
        );
        navigator.mediaSession.playbackState = 'paused';
    };

    playOrPaues = () => {
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
            this.myAudioRef.current.currentTime = 0;
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
                    <List className={classes.list} dense>
                        {items.map((value, idx) => {
                            const labelId = `label-${value.intro}`;
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
                                        primary={`${value.intro}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                    <audio
                        // controls  // OK?
                        // title={items[currentIndex]?.src}   // OK?
                        ref={this.myAudioRef}
                        src={items[currentIndex]?.src}
                    />
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
                                aria-label=""
                                onClick={this.pause}
                            >
                                <Pause />
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton
                                edge="end"
                                aria-label=""
                                onClick={this.play}
                            >
                                <PlayArrow />
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
                    </Grid>
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
