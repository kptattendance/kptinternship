import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="text-gray-600 body-font bg-blue-50 shadow ">
      {/* Top Section */}
      <div className="container px-5 py-16 mx-auto flex flex-wrap md:flex-nowrap flex-col md:flex-row justify-between items-start gap-10">
        {/* Left Logo & Address */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-1/4">
          <img
            src="/logo.jpg" // your first logo
            alt="KPT Logo"
            className="h-24 w-auto mb-4"
          />
          <h2 className="text-lg font-semibold text-gray-900">
            Karnataka Govt. Polytechnic
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-6">
            Kadri Hills, Mangalore, Karnataka - 575004
          </p>
          <p className="mt-1 text-sm text-gray-500">
            📧 kptmng@gmail.com (Official)
          </p>
        </div>

        {/* Quick Links */}
        <div className="w-full md:w-1/4 px-4">
          <h2 className="title-font font-semibold text-gray-900 tracking-widest text-sm mb-3">
            QUICK LINKS
          </h2>
          <nav className="flex flex-col space-y-2">
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/112/milestones/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              KPT Website
            </a>
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/10/campus-map/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Our Campus
            </a>
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/50/fee-structure/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Admissions
            </a>
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/18/contact/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Contact Us
            </a>
          </nav>
        </div>

        {/* Resources */}
        <div className="w-full md:w-1/4 px-4">
          <h2 className="title-font font-semibold text-gray-900 tracking-widest text-sm mb-3">
            RESOURCES
          </h2>
          <nav className="flex flex-col space-y-2">
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/44/recently-visited-companies/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Placements
            </a>
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/57/list-of-principal%27s-/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Principal
            </a>
            <a
              href="https://kptalumni.org/"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Alumni
            </a>
            <a
              href="https://gpt.karnataka.gov.in/kptmangalore/public/115/events-/en"
              className="text-gray-600 hover:text-blue-700 transition-colors"
            >
              Events
            </a>
          </nav>
        </div>

        {/* Contact Details & Second Logo */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-1/4">
          <img
            src="/logo2.png" // your second logo
            alt="KPT 75 Logo"
            className="h-24 w-auto mb-4"
          />
          <h2 className="text-lg font-semibold text-gray-900">
            Contact Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            📞 (0824) - 3516910, 3542476, 2211636, 3515889
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-350 border-t ">
        <div className="container mx-auto py-4 px-5 flex flex-wrap flex-col sm:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Karnataka Govt. Polytechnic — All
            Rights Reserved
          </p>
          <span className="inline-flex mt-2 text-gray-500 text-sm sm:mt-0">
            Maintained by KPT CSE Final year students
            {/* <a
              href="#"
              className="text-gray-500 hover:text-white hover:bg-blue-600 rounded-full p-2 transition-colors"
            >
              <FaFacebookF className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="ml-3 text-gray-500 hover:text-white hover:bg-blue-400 rounded-full p-2 transition-colors"
            >
              <FaTwitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="ml-3 text-gray-500 hover:text-white hover:bg-pink-500 rounded-full p-2 transition-colors"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="ml-3 text-gray-500 hover:text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
            >
              <FaLinkedinIn className="w-4 h-4" />
            </a> */}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
