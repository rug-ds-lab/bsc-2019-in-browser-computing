document.getElementById('checkbox-1').addEventListener('change', (e) => {
    //Get the value from the input
    const isChecked = e.target.checked;
    //Send the information to the active tab
    const parameters = {
        active: true,
        currentWindow: true,
    };

    chrome.tabs.query(parameters, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, isChecked);
    });
});
