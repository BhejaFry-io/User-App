import React from 'react';
import StaticPageLayout from '../StaticPageLayout';
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

// The Bhejafry Dev Team. Replace the placeholder URLs with actual LinkedIn links.
const developers = [
  { name: "Yash Bhardwaj", linkedin: "https://www.linkedin.com/in/bhardwajjyash/" },
  { name: "Janit Berwal", linkedin: "https://www.linkedin.com/in/janit-berwal-91a015286/" },
  { name: "Harsh Verma", linkedin: "https://www.linkedin.com/in/harshzz/" },
  { name: "Swayam Gupta", linkedin: "https://www.linkedin.com/in/swayam-gupta-1295b5288/" },
  { name: "Nikhil Upadhyay", linkedin: "https://www.linkedin.com/in/nikhil-upadhyay-3547ba2b4/" },
];

export default function ContactUs() {
  return (
    <StaticPageLayout title="Contact Us">
      <p className="mb-6 text-gray-200">
        Got a question, bug report, or just want to say hi? We'd love to hear from you!
      </p>

      {/* Main Flex Container for the 2 columns */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 mt-4">
        
        {/* Left Column: BhejaFry Contact */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Game Contact</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <MdEmail className="text-2xl text-red-500" />
              <a
                href="mailto:bhejafry.fun@gmail.com"
                className="hover:underline text-gray-300 hover:text-white transition-colors"
              >
                bhejafry.fun@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <FaInstagram className="text-2xl text-pink-500" />
              <a
                href="https://www.instagram.com/bhejafry.fun/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-gray-300 hover:text-white transition-colors"
              >
                @BhejaFryGame
              </a>
            </li>
          </ul>
        </div>

        {/* Vertical Divider (Hidden on mobile, visible on medium+ screens) */}
        <div className="hidden md:block w-[2px] bg-gray-600 rounded-full"></div>
        {/* Horizontal Divider (Visible on mobile, hidden on medium+ screens) */}
        <div className="block md:hidden h-[2px] w-full bg-gray-600 rounded-full my-2"></div>

        {/* Right Column: Developers List */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">The Developers</h3>
          <ul className="space-y-3">
            {developers.map((dev, index) => (
              <li key={index} className="flex items-center gap-3">
                <a
                  href={dev.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A66C2] hover:opacity-80 transition-opacity bg-white rounded-sm"
                  aria-label={`${dev.name}'s LinkedIn`}
                >
                  <FaLinkedin className="text-2xl" />
                </a>
                <span className="text-gray-300 font-medium">{dev.name}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </StaticPageLayout>
  );
}