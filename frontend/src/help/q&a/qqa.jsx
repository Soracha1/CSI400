import React from "react";
import "./qqa.css";

function Qqa() {
    return (
        <section className="qqa-container" aria-labelledby="qqa-heading">
            <div className="qqa-card">
                <h1 className="qqa-header" id="qqa-heading">Q&A (Frequently Asked Questions)</h1>

                <div className="qqa-list">
                    <div className="qqa-item">
                        <strong>Q1:</strong> What is this app?<br />
                        <strong>A1:</strong> This app is a platform for musicians, producers, and creators to upload, share, and download music sounds such as drum kits, synths, and sound effects for free, to use in music production.
                    </div>

                    <div className="qqa-item">
                        <strong>Q2:</strong> Do I need to sign up before using the app?<br />
                        <strong>A2:</strong> Yes. You need to register an account so the system can manage your profile, track uploads/downloads, and prevent copyright violations.
                    </div>

                    <div className="qqa-item">
                        <strong>Q3:</strong> What types of audio files can be uploaded?<br />
                        <strong>A3:</strong> The app supports .mp3, .wav, .ogg. Each file can include name, type, BPM, and key.
                    </div>

                    <div className="qqa-item">
                        <strong>Q4:</strong> Can I use downloaded sounds commercially?<br />
                        <strong>A4:</strong> Only sounds labeled “Free for commercial use” can be used for commercial purposes.
                    </div>

                    <div className="qqa-item">
                        <strong>Q5:</strong> How is this app different from other websites?<br />
                        <strong>A5:</strong> Completely free, includes search, preview, and a community section for sharing and commenting.
                    </div>

                    <div className="qqa-item">
                        <strong>Q6:</strong> Can I delete sounds I uploaded?<br />
                        <strong>A6:</strong> Yes. Users can delete their own uploaded sounds anytime from their profile.
                    </div>

                    <div className="qqa-item">
                        <strong>Q7:</strong> Are uploaded sounds reviewed before publishing?<br />
                        <strong>A7:</strong> Yes. Admin reviews all uploaded sounds to prevent copyright or inappropriate content.
                    </div>

                    <div className="qqa-item">
                        <strong>Q8:</strong> Does the app have a rating/comment system?<br />
                        <strong>A8:</strong> Yes. Users can like, rate, and comment to help the community grow.
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Qqa;
