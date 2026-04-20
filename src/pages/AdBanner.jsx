import React, { useEffect } from 'react';

const AdBanner = () => {
  useEffect(() => {
    try {
      // Pushes the ad to render once the component mounts
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error", err);
    }
  }, []);

  return (
    <div className="w-full flex justify-center bg-transparent py-4 mt-auto">
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-4277642434697859"
        data-ad-slot="9745993695"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;