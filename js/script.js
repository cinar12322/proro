/**
 * Cash Launcher - Main JavaScript File
 * Handles interactive functionality for the website
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the download button element
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Check if download button exists
    if (downloadBtn) {
        // Add click event listener to download button
        downloadBtn.addEventListener('click', handleDownload);
    }
    
    /**
     * Handle download button click
     * Shows an alert and simulates download action
     */
    function handleDownload() {
        // Show alert message
        alert('Thank you for downloading Cash Launcher!\n\nYour download will begin shortly...');
        
        // Simulate download action
        // In a real application, this would trigger an actual file download
        simulateDownload();
    }
    
    /**
     * Simulate download action
     * Creates a temporary download link and triggers it
     */
    function simulateDownload() {
        // Create a temporary anchor element
        const link = document.createElement('a');
        
        // Set download attributes
        link.href = '#'; // In production, this would be the actual download URL
        link.download = 'CashLauncher.exe'; // Filename for download
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Log download action (for development/debugging)
        console.log('Download initiated: CashLauncher.exe');
        
        // Optional: Show success message after a short delay
        setTimeout(function() {
            console.log('Download simulation completed');
        }, 1000);
    }
    
    // Optional: Add smooth scroll behavior for better UX
    // This enhances the overall user experience
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

