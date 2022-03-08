import React, { Component } from 'react';
import axios from 'axios';

import { BrandNav } from './Main';

import "../Styles/Tracks.css"

import AudioPlayer from './AudioPlayer';
import { auth, db, } from "../services/firebase";
import {Link} from "react-router-dom";
import Cookies from 'universal-cookie';

class Tracks extends Component {
    constructor(props)
    {
        super(props);
        const cookies= new Cookies();
        const {
            nowPlaying,
            playingSongImage,
            isPlaying,
            playingSongLink,
            playingArtist}=cookies.get("playerState");
        this.state={
            playListId: "",
            nowPlaying:"",
            playingSongImage:"",
            isPlaying:false,
            playingSongLink:"",
            playingArtist:"",
            nowPlaying,
            playingSongImage,
            isPlaying,
            playingSongLink,
            playingArtist,
            
            tracks: [],
        }
        this.setPlayList = this.setPlayList.bind(this)
        this.togglePlaying = this.togglePlaying.bind(this);
    }

    async setPlayList(data) {
        //this.setState({playListId: data})
        //console.log(this.state.playListId)
        const cookies = new Cookies
        try {
            await axios({
                url: 'https://api.spotify.com/v1/playlists/'+data+'?limit=10',
                method: 'GET',
                headers: {
                  "Authorization": "Bearer " + cookies.get("access_token"),
                  "Accept": "application/json",
                  "Content-Type": "application/json",
                },
              }).then(response => {
                  //this.setCategories(response.data.categories.items)
                  //console.log(response.data.tracks)//.map((track) => {
                    //console.log(track)
                    //this.setState({tracks: response.data.tracks.items})
                    //})//.data.playlists.items[0].id)
                    const tracksArray = [];
                    response.data.tracks.items.map((song) => {
                        if(song.track.preview_url) {
                            tracksArray.push(song.track)

                        }
                    })
                    //console.log(tracks)
                    this.setState({tracks: tracksArray})
                    }
              );
          } catch (error) {
            console.log(error);
          }
    }

    async componentDidMount() {
        const cookies = new Cookies
        const id = this.props.location.state.id
        try {
            await axios({
                url: 'https://api.spotify.com/v1/browse/categories/'+id+'/playlists?limit=10',
                method: 'GET',
                headers: {
                  "Authorization": "Bearer " + cookies.get("access_token"),
                  "Accept": "application/json",
                  "Content-Type": "application/json",
                },
              }).then(response => {
                  //this.setCategories(response.data.categories.items)
                  console.log(response)
                  this.setPlayList(response.data.playlists.items[0].id)
              }).catch(function(error) {
                  console.log(error)
                  alert("Couldn't find "+id+" playlist...")
              });
          } catch (error) {
            console.log(error);
          }
    }

    togglePlaying(index, playerState)
    {
        const {tracks}=this.state;
        
        const newState={nowPlaying:tracks[index].name,
            playingSongImage:tracks[index].album.images[0].url,
            playingSongLink:tracks[index].preview_url,
            playingArtist: tracks[index].artists[0].name,
            isPlaying:true};

        this.setState({
            nowPlaying:tracks[index].name,
            playingSongImage:tracks[index].album.images[0].url,
            playingSongLink:tracks[index].preview_url,
            playingArtist: tracks[index].artists[0].name,
            isPlaying:true
        })

            const cookies= new Cookies();
            cookies.set("playerState",newState);
            //console.log(cookies.get("playerState"))
    }

    render() {
        console.log(this.props.location.state.id)
        const {tracks}=this.state;
        const cookies=new Cookies();
        const PlayerState=cookies.get("playerState")
        let playerState="tracks-list list-group";
        if(this.state.isPlaying)
            playerState+=" show-player";
        else
            playerState+=" hide-player"
        return (            
            <div className="track-container">
                <BrandNav/>
                <p className="tracks-title">Iconic handpicked songs</p>
                <p className="tracks-subtitle">Just for you</p>
                <div style={{"textAlign":"center"}}>
                <button type="button" class="tracks-play-botton btn btn-secondary btn-lg" onClick={()=>this.togglePlaying(0)}>Play Now</button>
                </div>
                <div ref={this.playerRef} className={playerState}>
                {tracks.map((song,index)=>(
                    song?.preview_url?
                        <TracksMenu
                            songTitle = {song.name}
                            songArtist = {song.artists[0].name}
                            songImage = {song.album.images[0].url}
                            songLink = {song.preview_url}
                            index = {index}
                            onClick = {()=>this.togglePlaying(index)}
                        />
                        :
                        <br></br>

                ))}
                </div>
                {this.state.isPlaying &&
                <AudioPlayer/>
                }
            </div>
        );
    }
}

export default Tracks;


class TracksMenu extends Component {
    constructor(props) {
        super(props)
        this.state = {
            user: auth().currentUser.uid,
            liked: false,
        }
        this.onLikeCliked = this.onLikeCliked.bind(this)
    }

    async componentDidMount() {
        try {
            //console.log("fetching liked songs")
            db.ref("users")
            .child(this.state.user)
            .child("likedSongs")
            .orderByChild("songTitle")
            .equalTo(this.props.songTitle)
            .on("value", (snapshot) => {
                //console.log(snapshot.val())
              if (snapshot.exists()) {
                this.setState({liked: true})
                //console.log("found")
              } else {
                this.setState({liked: false}) 
                //console.log("not-found")
              }
            });
        }
        catch(error) {
            this.setState({error: error.message});
        }
    }

    async onLikeCliked(event) {
        event.preventDefault();
        console.log(this.props.songLink)
        var userId = this.state.user
        var title = this.props.songTitle
        if(this.state.liked === false) {
            try {
                await db.ref("users").child(userId).child("likedSongs").child(title).set({
                        songTitle: this.props.songTitle,
                        songArtist: this.props.songArtist,
                        songImage: this.props.songImage,
                        songLink: this.props.songLink,
                    }
                );
                this.setState({liked: true})
            }
            catch(error) {
            console.log(error.message);
            }
        }
        else {
            try {
                await db.ref("users").child(userId).child("likedSongs").child(title).set(null);
                this.setState({liked: false})
            }
            catch(error) {
            console.log(error.message);
            }
        }
    }

    render() {
        const {songTitle,songArtist} = this.props;

        let TrackLiked = 'track-'
        this.state.liked ? TrackLiked += 'liked' : TrackLiked += 'not-liked'
        return (
            <div className='song-container'>
                <p onClick={this.props.onClick} href="#" class="track-single list-group-item  " aria-current="true">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="track-text mb-1">{songTitle}</h5>
                        <button type='button' className={TrackLiked + " btn btn-secondary btn-lg"} onClick={this.onLikeCliked}/> 
                    </div>
                    <p class="track-text mb-1">{songArtist}</p>
                    
                
                    
                </p>

            </div>
        )
    }
}
