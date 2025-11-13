import React from "react";
import "./qqa.css";

function QandA() {
    return (
        <div className="qna-container">
            <h1 className="qna-header">Q&A (Frequently Asked Questions)</h1>
            <p>
                <strong>Q1:</strong> What is this app?<br />
                <strong>A1:</strong> This app is a platform for musicians, producers, and creators to upload, share, and download music sounds such as drum kits, synths, and sound effects for free, to use in music production.
                <br /><br />
                <strong>Q2:</strong> Do I need to sign up before using the app?<br />
                <strong>A2:</strong> Yes. You need to register an account so the system can manage your profile, keep track of your uploaded and downloaded sounds, and prevent copyright violations.
                <br /><br />
                <strong>Q3:</strong> What types of audio files can be uploaded?<br />
                <strong>A3:</strong> The app supports various file formats such as .mp3, .wav, and .ogg. Each uploaded file can include details like name, sound type, BPM, and key.
                <br /><br />
                <strong>Q4:</strong> Can I use the downloaded sounds for commercial purposes?<br />
                <strong>A4:</strong> Only sounds labeled as “Free for commercial use” can be used for commercial purposes. Please check each file's license information carefully before using it.
                <br /><br />
                <strong>Q5:</strong> How is this app different from other websites?<br />
                <strong>A5:</strong> This app is completely free to use — no monthly fees required. It includes sound search and preview features, and a community section where users can share and comment on sounds
                <br /><br />
                <strong>Q6:</strong> Can I delete sounds that I have uploaded?<br />
                <strong>A6:</strong> Yes. Users can delete their own uploaded sounds anytime through their profile page.
                <br /><br />
                <strong>Q7:</strong> Are uploaded sounds reviewed before being published?<br />
                <strong>A7:</strong> Yes. All uploaded sounds are reviewed by an admin to prevent copyrighted or inappropriate content from being shared.
                <br /><br />
                <strong>Q8:</strong> Does the app have a rating or comment system?<br />
                <strong>A8:</strong> Yes. U sers can like, rate, and comment on their favorite sounds to help the community grow and encourage creative collaboration. 
            </p>
        </div>
    );
}

export default QandA;