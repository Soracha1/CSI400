import React from "react";
import "./help.css";

function Help() {
  return (
    <div className="help-container">
      <h1 className="help-header">Help & Support</h1>
      <p>
        <strong>1.</strong> หากคุณต้องการใช้งานครั้งแรก โปรดสมัครสมาชิกก่อนโดยคลิกที่ “Sign Up” แล้วกรอกข้อมูลให้ครบถ้วน
        <br /><br />
        <strong>2.</strong> เมื่อลงทะเบียนเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้โดยคลิก “Login”
        <br /><br />
        <strong>3.</strong> หากต้องการอัปโหลดเสียง ไปที่หน้า “Upload” แล้วเลือกไฟล์เสียงของคุณ (.mp3, .wav, .ogg) พร้อมกรอกรายละเอียดต่าง ๆ
        <br /><br />
        <strong>4.</strong> สามารถดาวน์โหลดเสียงได้จากหน้า “Browse Sounds” โดยคลิกปุ่ม “Download” ใต้ไฟล์ที่ต้องการ
        <br /><br />
        <strong>5.</strong> หากพบปัญหาหรือข้อผิดพลาดในการใช้งาน กรุณาติดต่อทีมงานเพื่อขอความช่วยเหลือ
        <br /><br />
        <strong>6.</strong> แนะนำให้อ่านรายละเอียดสิทธิ์การใช้งานของเสียงแต่ละไฟล์ก่อนนำไปใช้เชิงพาณิชย์
        <br /><br />
        <em>หวังว่าคู่มือนี้จะช่วยให้คุณใช้งานแอปได้สะดวกมากขึ้นครับ 🎵</em>
      </p>
    </div>
  );
}

export default Help;
