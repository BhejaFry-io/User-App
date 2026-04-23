import React from 'react';
import StaticPageLayout from '../StaticPageLayout';
import { FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function ContactUs() {
  return (
    <StaticPageLayout title="Contact Us">
      <p>Got a question, bug report, or just want to say hi? We'd love to hear from you!</p>

      <ul className="pl-6 mt-4 space-y-3">

        {/* Email */}
        <li className="flex items-center gap-2">
          <MdEmail className="text-xl text-red-500" />
          <a
            href="mailto:bhejafry.fun@gmail.com"
            className="hover:underline"
          >
            bhejafry.fun@gmail.com
          </a>
        </li>

        {/* Instagram */}
        <li className="flex items-center gap-2">
          <FaInstagram className="text-xl text-pink-500" />
          <a
            href="https://www.instagram.com/bhejafry.fun/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            @BhejaFryGame
          </a>
        </li>

      </ul>
    </StaticPageLayout>
  );
}