import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">About Libroware</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          A modern library management system developed by Kris David Steeve Ella
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-8">
        <div className="bg-emerald-600 dark:bg-emerald-700 p-6 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white flex-shrink-0">
              <img 
                src="/images/photo_2024-09-11_12-30-18.jpg"
                alt="Kris David Steeve Ella"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">Kris David Steeve Ella</h2>
              <p className="text-emerald-100 mb-2">Digital Engineer - IT Professional - Graphic Designer</p>
              <p className="text-sm">
                5th Year Engineering student, passionate about digital systems engineering, specializing in UI/UX Design, 
                Digital Networking and telecommunications as well as Cloud computing.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                Professional Experience
              </h3>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">IT Engineer - Artistic Director - Developer</h4>
                  <span className="text-sm text-white bg-emerald-600 dark:bg-emerald-700 px-2 py-1 rounded">July 2024 - Today</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Richenet's AI Agency
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Managing digital solutions for a leading promotional digital agency specialised in AI solutions.
                  In charge of adapting cloud solutions, brand designing, and developing web solutions.
                </p>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Co-founder, Cloud Engineer and Designer</h4>
                  <span className="text-sm text-white bg-emerald-600 dark:bg-emerald-700 px-2 py-1 rounded">2022 - Today</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  LAMEUTE
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Co-founded a start-up specialising in providing major technology services including software development, 
                  graphic design, and cloud solutions provision.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                Education & Skills
              </h3>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Digital Engineering at ESIGN-UIECC</h4>
                  <span className="text-sm text-white bg-emerald-600 dark:bg-emerald-700 px-2 py-1 rounded">2019 - 2024/25</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  International Advanced School of Digital Engineering (Université Inter-États Congo Cameroun).
                  Specializing in cloud solutions preparation.
                </p>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">GCE (Ordinary Level & Advanced Level)</h4>
                  <span className="text-sm text-white bg-emerald-600 dark:bg-emerald-700 px-2 py-1 rounded">2011 - 2018</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Government Bilingual Practicing High School Yaounde (GBPHS)
                </p>
              </div>
              
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Technical Skills</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <li>Programming</li>
                <li>Networking</li>
                <li>UI/UX Design</li>
                <li>Cloud Computing</li>
                <li>Documentation</li>
                <li>Web Development</li>
              </ul>
              
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Languages</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                French (Native), English (Fluent)
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
          About Libroware
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Libroware is a modern library management system designed to streamline the process of managing books, users, and borrowing activities.
          Built with the latest technologies, it provides a seamless experience for both librarians and patrons.
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          This project was developed as part of a passion for creating efficient digital solutions that solve real-world problems.
          The application features role-based access control, comprehensive book management, user activity tracking, and a modern, responsive interface.
        </p>
      </div>
    </div>
  );
};

export default AboutPage; 