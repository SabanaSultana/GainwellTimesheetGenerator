import React from 'react'
import logo from '../assets/logo_2.png'
import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaInstagram,
  FaLinkedinIn
} from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="bg-[#1F2E60] text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

        {/* Left: Logo + Description */}
        <div>
          <img src={logo} alt="Logo" className="h-25 w-30 mb-4" />
          <p className="text-sm text-gray-200 leading-relaxed max-w-md">
            Gainwell Engineering is committed to drive sustainability,
            innovation and excellence for shaping and enabling a better
            tomorrow
          </p>
        </div>

        {/* Middle: Links */}
        <div className="md:pl-16">
          <ul className="space-y-4 text-sm font-medium">
            <li className="hover:text-gray-300 cursor-pointer">PRODUCTS</li>
            <li className="hover:text-gray-300 cursor-pointer">CAREERS</li>
            <li className="hover:text-gray-300 cursor-pointer">ABOUT US</li>
          </ul>
        </div>

        {/* Right: Social Icons */}
        <div className="flex md:justify-end gap-3">
          {[FaFacebookF, FaTwitter, FaYoutube, FaInstagram, FaLinkedinIn].map((Icon, index) => (
            <div
              key={index}
              className="w-10 h-10 bg-white text-[#273469] flex items-center justify-center rounded-sm hover:bg-gray-200 transition cursor-pointer"
            >
              <Icon size={18} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4 text-center text-sm text-gray-300">
        Copyright © 2024 &nbsp;•&nbsp;
        <span className="hover:text-white cursor-pointer">PRIVACY POLICY</span>
      </div>
    </footer>
  )
}

export default Footer
