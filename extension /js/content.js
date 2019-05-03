chrome.runtime.onMessage.addListener((isChecked) => {
    console.log(isChecked ? 'Browser Workload Enabled' : 'Browser Workload Disabled');
});
