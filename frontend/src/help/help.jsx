import React from "react";
import "./help.css";

export default function HelpSupport() {
  return (
    <section className="help-container" aria-labelledby="help-heading">
      <div className="help-card">
        <header className="help-header">
          <h1 id="help-heading">Help &amp; Support</h1>
          <p className="help-sub">ถ้าต้องการความช่วยเหลือ ดูคำแนะนำด้านล่างนี้ก่อนครับ 🎵</p>
        </header>

        <ol className="help-list">
          <li>
            <strong>สมัครใช้งานครั้งแรก:</strong>
            <p>คลิก “Sign Up” แล้วกรอกข้อมูลให้ครบถ้วน</p>
          </li>
          <li>
            <strong>เข้าสู่ระบบ:</strong>
            <p>คลิก “Login” เพื่อเข้าสู่ระบบ</p>
          </li>
          <li>
            <strong>อัปโหลดเสียง:</strong>
            <p>ไปหน้า “Upload” และเลือกไฟล์เสียงพร้อมรายละเอียด</p>
          </li>
          <li>
            <strong>ดาวน์โหลดเสียง:</strong>
            <p>ไปหน้า “Browse Sounds” และคลิก “Download” ใต้ไฟล์</p>
          </li>
          <li>
            <strong>ติดต่อทีมงาน:</strong>
            <p>ติดต่อทีมงานเพื่อขอความช่วยเหลือ</p>
          </li>
          <li>
            <strong>สิทธิ์การใช้งาน:</strong>
            <p>อ่านรายละเอียดสิทธิ์การใช้งานก่อนใช้เชิงพาณิชย์</p>
          </li>
        </ol>

        <footer className="help-footer">
          หวังว่าคู่มือนี้จะช่วยให้คุณใช้งานแอปได้สะดวกมากขึ้นครับ
        </footer>
      </div>
    </section>
  );
}
