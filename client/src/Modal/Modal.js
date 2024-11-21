import React, { useState } from "react";

const Modal = ({ title, sections, onClose }) => {
  const [activeSection, setActiveSection] = useState(Object.keys(sections)[0]); // Default to the first section

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white border-2 rounded shadow-lg w-full max-w-2xl mx-4">
          <div className="relative">
            {title && (
              <div className="p-4 pb-2 border-b bg-gray-50">
                <h1 className="text-[18px] font-bold text-green-800">
                  {title}
                </h1>
              </div>
            )}
            <div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-200 text-center text-[24px] hover:text-gray-900  bg-green-800 w-6 h-6 border pb-1 rounded flex justify-center items-center">
                &times;
              </button>
            </div>
          </div>

          <div className="flex">
            <div className="w-[35%] bg-gray-100 p-4 border-r text-[14px]">
              <ul className="space-y-3">
                {Object.keys(sections).map((section) => (
                  <li
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`cursor-pointer p-2 rounded-lg ${
                      activeSection === section
                        ? "bg-green-800 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}>
                    {section}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-3/4 p-6">
              <div>
                <div>{sections[activeSection]}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
