import React from 'react';
import StaticPageLayout from '../StaticPageLayout';

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="Privacy Policy">
      <p>Your privacy is important to us. We only collect the necessary information required to authenticate you via Google and keep track of your game scores.</p>
      <p>We do not sell your data to third parties. We use standard local storage to save your session details for a seamless gaming experience.</p>
    </StaticPageLayout>
  );
}