import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import { NavigationMixin } from 'lightning/navigation';

export default class BarCodeScanner extends NavigationMixin(LightningElement) {
    myScanner;
    scanButtonDisabled = false;
    scannedBarCode = 'https://www.google.com';
 
    // When component is initialized, detect whether to enable Scan button
    connectedCallback() {
        this.myScanner = getBarcodeScanner();
        if (this.myScanner == null || !this.myScanner.isAvailable()) {
            this.scanButtonDisabled = true;
        }
        console.log('inside connected callback');
    }
 
    //When Scan Barcode button is clicked, scan the barcode and read the value
    handleScanBarcode(event) {
        event.preventDefault();
        this.scannedBarCode = ''; // Reset scannedBarCode to empty string before starting new scan
        const scanningOptions = {
            barcodeTypes: [
                this.myScanner.barcodeTypes.QR,
                this.myScanner.barcodeTypes.EAN_8
            ],
            instructionText: 'Scan a QR Code',
            successText: 'Scanning complete.'
        };
        this.myScanner.beginCapture(scanningOptions)
            .then((result) => {
                console.log(result);
                
                /* Do something with the barcode scan value:
                   - look up a record
                   - create or update a record
                   - parse data and put values into a form etc.
                Here, we just display the scanned value in the UI*/
                //this.scannedBarCode = result.value;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Successful Scan',
                        message: 'Barcode scanned successfully.',
                        variant: 'success'
                    })
                );
            })
            .catch((error) => {
                // Handle cancellation and unexpected errors here
                console.error('Scan Error: ' + JSON.stringify(error));
                if (error.code == 'userDismissedScanner') {
                    // User clicked Cancel
                    this.dispatchToastEvent('Scanning Cancelled',
                        'You cancelled the scanning session.',
                        'error',
                        'sticky'
                    );
                } else { 
                    // Inform the user we ran into something unexpected
                    this.dispatchToastEvent('Barcode Scanner Error',
                        'There was a problem scanning the barcode: ' + error.message,
                        'error',
                        'sticky'
                    );
                }
            })
            .finally(() => {
                console.log('#finally');
                // Clean up by ending capture,
                // whether we completed successfully or had an error
                this.myScanner.endCapture();
            });
    }
 
    dispatchToastEvent(title, errorMessage, variant, mode) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: errorMessage,
            variant: variant,
            mode: mode
        })
        this.dispatchEvent(toastEvent);
    }

    // Computed property to generate the encoded URL
    get encodedBarcodeUrl() {
        return encodeURI(this.scannedBarCode);
        console.log('link: '+encodeURI(this.scannedBarCode));
    }

    navigateToWebPage(){
    /*    const navigate = {
            type: 'standard__webPage',
            attributes: {
                url: this.encodedBarcodeUrl()
            }
        };
        this.NavigationMixin.Navigate;*/
        //window.open(this.encodedBarcodeUrl(), "_blank");
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: this.encodedBarcodeUrl()
            }
        }).then(generatedUrl =>{
            window.open(generatedUrl , "_blank");
        });
    }
    
    copyToClipboard() {
        console.log('inside copy to clipboard--start method');
        const textArea = document.createElement('textarea');
        textArea.value = this.encodedBarcodeUrl();
        console.log('textArea.value:'+textArea.value);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.dispatchToastEvent('Success','URL Copied', 'success','dismissible');
        console.log('inside copy to clipboard--end method');
    }

    //This piece of code run in secure context
    /*async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(encodeURI(this.scannedBarCode));
            // Success! The URL is copied to the clipboard.
            // You can show a success message to the user if needed.
            // Example:
            this.dispatchToastEvent('Success','URL Copied', 'success','dismissible');
        } catch (error) {
            // Handle any errors (e.g., permissions denied)
            console.error('Error copying to clipboard:', error);
            // You can show an error message to the user if needed.
            // Example:
            this.dispatchToastEvent('Error','Error Copying URL: ' + error.message,'error','dismissible');
        }
        
    }*/

}