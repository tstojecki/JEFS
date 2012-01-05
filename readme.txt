To install the package, run the following form the SharePoint Management Shell console:

$wsp = get-item .\jefs.wsp
Add-SPSolution -LiteralPath $wsp.FullName -Confirm:$false
Install-SPSolution -Identity $wsp.Name -GACDeploy -Confirm:$false

Once the commands run, clear your browser's cache to refresh the ribbon.

To uninstall the package:
Uninstall-SPSolution -Identity $wsp.Name -Confirm:$false
Remove-SPSolution -Identity $wsp.Name -Confirm:$false

If you deploy from within Visual Studio and have updated the jefs.debug.js file, check out the jefs.js and run minify.bat before deploying the package.
This will ensure that the minified and the debug files are in sync.,