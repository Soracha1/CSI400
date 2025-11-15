import React from "react";
import "./contact.css";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";

function Contact() {
    return (
        <section className="contact-container" aria-labelledby="contact-heading">
            <div className="contact-card">
                <h1 className="contact-header" id="contact-heading">
                    We'd love to hear from you! If you have any questions, feedback, or technical issues while using our platform, please reach out to us through the form below or contact us directly via email.
                </h1>

                <p className="contact-text">
                    📞 Contact Information: <br />
                    Email: support@soundhub.com <br />
                    Phone: +66 98 123 4567 <br />
                    Address: SoundShare Development Team, Bangkok, Thailand
                </p>  

                {/* Social Icons */}
                <div className="social-icons">
                    <FaFacebookF />
                    <FaInstagram />
                    <FaTiktok />
                </div>
            </div>
        </section>
    );
}

export default Contact;
