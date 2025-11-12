import React from "react";
import "./help.css";

function Help() {
  return (
    <div className="help-container">
      <h1 className="help-header">Help & Support</h1>
      <p className="help-text">
        หากคุณมีคำถามหรือพบปัญหาในการใช้งานแอป สามารถดูขั้นตอนช่วยเหลือตามด้านล่างนี้ได้เลย 👇
      </p>

      <ul className="help-list">
        <li>
          <strong>1. สมัครสมาชิก:</strong>  
          คลิกที่ปุ่ม “Sign Up” แล้วกรอกอีเมลและรหัสผ่านของคุณเพื่อสร้างบัญชีใหม่
        </li>
        <li>
          <strong>2. เข้าสู่ระบบ:</strong>  
          เมื่อสมัครเสร็จแล้ว ให้คลิก “Login” เพื่อเข้าสู่ระบบและเริ่มใช้งานแอป
        </li>
        <li>
          <strong>3. อัปโหลดเสียง:</strong>  
          ไปที่หน้า “Upload” แล้วเลือกไฟล์เสียงของคุณ (.mp3, .wav, .ogg) พร้อมกรอกรายละเอียด เช่น ชื่อ, ประเภทเสียง, BPM, และคีย์
        </li>
        <li>
          <strong>4. ดาวน์โหลดเสียง:</strong>  
          ไปที่หน้า “Browse Sounds” แล้วคลิกที่ปุ่ม “Download” ใต้เสียงที่คุณต้องการ
        </li>
        <li>
          <strong>5. รายงานปัญหา:</strong>  
          หากพบข้อผิดพลาด สามารถติดต่อทีมงานได้ที่อีเมล  
          <a href="mailto:support@musicsamplehub.com">support@musicsamplehub.com</a>
        </li>
      </ul>

      <p className="help-footer">
        💡 <em>Tip:</em> แนะนำให้อัปเดตโปรไฟล์และตรวจสอบสิทธิ์การใช้งานของเสียงก่อนนำไปใช้เชิงพาณิชย์
      </p>
    </div>
  );
}

export default Help;
