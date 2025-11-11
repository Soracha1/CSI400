import React from "react";
import "./contact.css";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";

function Contact() {
    return (
        <div className="contact-container">
            <h1 className="contact-header">
                We'd love to hear from you! If you have any questions, feedback, or technical issues while using our platform, please reach out to us through the form below or contact us directly via email.
            </h1>
            <p>
                📞 Contact Information:  
                Email: support@soundhub.com  
                Phone: +66 98 123 4567  
                Address: SoundShare Development Team, Bangkok, Thailand
            </p>  

            {/* Social Icons */}
            <div className="social-icons">
                <FaFacebookF />
                <FaInstagram />
                <FaTiktok />
            </div>
        </div>
    );
}

export default Contact;
