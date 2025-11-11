import React from "react";
import "./about.css";

function About() {
    return (
        <div className="about-container">
            <h1 className="about-box-header">Sound Share is the web's premiere community uploaded and curated sample library.
            Our aim is to super-charge your creative potential. 
            Thousands of audio samples have already been uploaded 
            to Sample Focus and new sounds are added daily!</h1>
           <p>
            Looking for one particular sound? We recognize 
            how difficult it can be to stay in your creative flow 
            when you are spending most of your time searching for 
            the audio tools you need. Get what you need and continue 
            creating, no need to spend precious time sorting through dense sound libraries. Everything on Sample Focus has already been meticulously tagged and catalogued for you.
            Our powerful tagging system allows sounds to be catalogued by category, 
            timbre, character, mood, and instrument. You can also filter samples by tempo range and musical key. Additionally, when you click on any sample you will see recommendations on similar sounds.
            Our hope is that Sound share helps you produce awesome audio creations.
           </p>    
        </div>
    );
}

export default About;