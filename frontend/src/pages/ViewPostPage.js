import React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Page from '../components/Page';
import MenuTabs from '../components/MenuTabs';
import { CgHeart } from 'react-icons/cg'; 
import Comment from '../components/ViewPostComponents/Comment';

import '../components/ViewPostComponents/ViewPost.css';
import background from "../background.jpg";

const bp = require('../components/Path');

function ViewPostPage() {
    const location = useLocation();
    const userID = JSON.parse(localStorage.getItem('userData'))._id;
    const accessToken = JSON.parse(localStorage.getItem('accessToken'));

    let post = location.state.post;
    let authorName = location.state.authorName;
    const imageBinary = `data:image/png;base64,${post.Image}`;

    const [imageLikes, setImageLikes] = useState(post.Likes);
    const [imageLikedBy, setImageLikedBy] = useState(post.LikedBy);
    const [display, setDisplay] = useState(() => {
        if (post.LikedBy.includes(userID))
            return {like:'none', unlike:''};
        else
            return {like:'', unlike:'none'};
    });

    const [comments, setComments] = useState([]);
    useEffect(() => {
        getComments();
    }, []);

    const getComments = async function() {
        let obj = {postID: post._id, accessToken: accessToken};
        let jsonPayload = JSON.stringify(obj);

        try {
            const response = await fetch(bp.buildPath('/api/getComments'), {
                method:'POST', body:jsonPayload, headers: {
                    'Content-Type':'application/json'
                }
            });

            let res = JSON.parse(await response.text());

            // JWT expired, return User to login page
            if (res.jwtExpired) {
                localStorage.removeItem('userData');
                localStorage.removeItem('accessToken');
                window.location.href='/';
                return;
            }

            if (res.error) {
                console.error(res.error);
                return;
            }

            setComments(res.comments);
            localStorage.setItem('accessToken', JSON.stringify(res.accessToken));
        }
        catch(e) {
            console.error(e);
        }
    }

    const likeImage = async function() {
        let obj = {postID: post._id, userID: userID, accessToken: accessToken};
        let jsonPayload = JSON.stringify(obj);
        
        try {
            const response = await fetch(bp.buildPath('/api/likePost'), {
                method:'PATCH', body:jsonPayload, headers: {
                    'Content-Type':'application/json'
                }
            });

            let res = JSON.parse(await response.text());

            // JWT expired, return User to login page
            if (res.jwtExpired) {
                localStorage.removeItem('userData');
                localStorage.removeItem('accessToken');
                window.location.href='/';
                return;
            }

            if (res.error) {
                console.error(res.error);
                return;
            }

            setImageLikes(prevLikes => {
                return prevLikes + 1;
            });
            setImageLikedBy(imageLikedBy => [...imageLikedBy, userID]);
            setDisplay({like:'none', unlike:''});

            localStorage.setItem('accessToken', JSON.stringify(res.accessToken));
        }
        catch(e) {
            console.error(e);
        }
    }
    
    const unlikeImage = async function() {
        let obj = {postID: post._id, userID: userID, accessToken: accessToken};
        let jsonPayload = JSON.stringify(obj);
        
        try {
            const response = await fetch(bp.buildPath('/api/unlikePost'), {
                method:'PATCH', body:jsonPayload, headers: {
                    'Content-Type':'application/json'
                }
            });

            let res = JSON.parse(await response.text());

            // JWT expired, return User to login page
            if (res.jwtExpired) {
                localStorage.removeItem('userData');
                localStorage.removeItem('accessToken');
                window.location.href='/';
                return;
            }

            if (res.error) {
                console.error(res.error);
                return;
            }

            setImageLikes(prevLikes => {
                return prevLikes - 1;
            });
            setImageLikedBy(imageLikedBy.filter(id => id !== userID));
            setDisplay({like:'', unlike:'none'});

            localStorage.setItem('accessToken', JSON.stringify(res.accessToken));
        }
        catch(e) {
            console.error(e);
        }
    }

    return(
        <div className="background" style={{ backgroundImage: `url(${background})` }}>
            <MenuTabs />
            <Page className='leftPage'>
                <div className='post-container'>
                    <span id='post-title'>{post.Title}</span>
                    <div className='image-container'>
                        <img src={imageBinary} alt='' />
                    </div>
                    <span id='view-post-likes'>
                        <CgHeart className='like-button' id='like'  style={{display:display.like}} onClick={likeImage} />
                        <CgHeart className='like-button' id='unlike' style={{display:display.unlike}} onClick={unlikeImage} />
                        {' ' + imageLikes}
                    </span>
                    <p id='view-post-description'>{post.Description}</p>
                </div>
            </Page>
            <Page className='rightPage'>
                <div className='comments-container'>
                    {comments.map(comment => <Comment key={comment._id} comment={comment} />)}
                </div>
                <button type='button'>
                    Add Comment
                </button>
            </Page>
        </div>
    );
}

export default ViewPostPage;