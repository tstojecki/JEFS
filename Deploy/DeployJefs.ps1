param(	
	[string]$webAbsUrl = $(throw "You must specify the value for the webAbsUrl parameter"),
    [string]$wspPath
)

function Load-Snapins()
{
    $snapinsToCheck = @("Microsoft.SharePoint.PowerShell")
    $currentSnapins = Get-PSSnapin

    $snapinsToCheck | ForEach-Object `
        {$snapin = $_;
            if(($CurrentSnapins | Where-Object {$_.Name -eq "$snapin"}) -eq $null)
            {
                Write-Host "$snapin snapin not found, loading it"
                Add-PSSnapin $snapin
                Write-Host "$snapin snapin loaded"
            }
        }
}

function DeleteExistingList($rootWeb) {
    $list = $rootWeb.Lists["JEFS"]
    if ($list) {
        write-host "Found JEFS list in the top level web. The list will be deleted in the next step. Backup the content you wish to save to another location, then press Y to continue ..." -foregroundcolor green
                
        do {
            $x = $host.UI.RawUI.ReadKey()
        } while (($x.character -ne "y") -or ($x.character -ne "Y"))
        
        $list.Delete()
        write-host ""
        write-host "List deleted"
    }
}

function TestSPUserSolution
{
	param ([string]$name, [string]$siteCollectionUrl, [switch]$added, [switch]$deployed)

	try {
		
		$sol = Get-SPUserSolution -Identity $name -Site $siteCollectionUrl
		
		if ($added)
		{
			return $true
		}
		
		if ($deployed) 
		{
			return $sol.Status -eq "Activated"
		}
		
	}
	catch 
	{	
		# Get-SPUserSolution throws an exception if the solution could not be found. 
		# Return false to both installed and deployed in that case.
		# $ex = $_.Exception
		return $false
	}
}


function WaitForJobToFinish([string]$SolutionFileName)
{ 
    $JobName = "*solution-deployment*$SolutionFileName*"
    $job = Get-SPTimerJob | ?{ $_.Name -like $JobName }
    
	if ($job)     
	{
        $JobFullName = $job.Name
        Write-Host -NoNewLine "Waiting to finish job $JobFullName"
        
		$maxAttempts = 0
        while ((Get-SPTimerJob $JobFullName) -ne $null) 
        {            
            Start-Sleep -Seconds 2
			$maxAttempts++
			
			if ($maxAttempts -gt 60)
			{
				throw "Job took too long to execute"
			}
        }
		
        Write-Host  "Job finished"
    }
}

function WaitForSolutionToRetract([string]$solutionName, [string]$siteCollectionUrl)
{
	$maxTries = 0
	
	while (TestSPUserSolution $solutionName $siteCollectionUrl -deployed)
	{
		Start-Sleep -Seconds 1
		$maxTries++
			
		if ($maxTries -gt 60)
		{
			throw "Unable to retract the solution " + $solutionName
		}	
	}	
}

if ([string]::IsNullOrEmpty($wspPath)) {
    $wspPath = ".\jefs.wsp"    
}

if (!(Test-Path -Path $wspPath)) {
	throw "The wsp was not found at " + $wspPath + ". Either copy the jefs.wsp file to the directory where the script runs or provide the value required in the -wspPath parameter: DeployJefs.wsp -wspPath <path-to-wsp>";
}

$wspItem = Get-Item -Path $wspPath

Load-Snapins

$web = get-spweb $webAbsUrl -ErrorAction Stop
$siteCollectionUrl = $web.Site.Url
write-host "Site collection url set to: " $siteCollectionUrl

DeleteExistingList $web.Site.RootWeb

if (TestSPUserSolution $wspItem.Name $siteCollectionUrl -deployed)
{	
	write-host "uninstalling (retracting) jefs.wsp (sandboxed solution)" $wspItem.Name "from" $siteCollectionUrl
	uninstall-spusersolution -Identity $wspItem.Name -Site $siteCollectionUrl -Confirm:$false
		
	WaitForJobToFinish $wspItem.Name
	WaitForSolutionToRetract $wspItem.Name $siteCollectionUrl $sandboxed
}	
		
if (TestSPUserSolution $wspItem.Name $siteCollectionUrl -added)
{
    write-host "removing (deleting) jefs.wsp (sandboxed solution)" $wspItem.Name "from" $siteCollectionUrl
	remove-spusersolution -identity $wspItem.Name -Site $siteCollectionUrl -Confirm:$false	
}

	
write-host "adding the sandboxed solution" $wspItem.Name "to" $siteCollectionUrl 
add-spusersolution -LiteralPath $wspItem.FullName -Site $siteCollectionUrl -Confirm:$false | Out-Null

write-host "installing (deploying) sandboxed solution" $wspItem.Name "to" $siteCollectionUrl
install-spusersolution -Identity $wspItem.Name -Site $siteCollectionUrl -Confirm:$false

WaitForJobToFinish $wspItem.Name

write-host "Activating features..." 

Disable-SPFeature -Identity "JEFS_JEFS Root List Feature" -Url $siteCollectionUrl -Confirm:$false -ErrorAction SilentlyContinue
Enable-SPFeature -Identity "JEFS_JEFS Root List Feature" -Url $siteCollectionUrl -Confirm:$false

Disable-SPFeature -Identity "JEFS_JEFS Root List Event Receiver Feature" -Url $webAbsUrl -Confirm:$false -ErrorAction SilentlyContinue
Enable-SPFeature -Identity "JEFS_JEFS Root List Event Receiver Feature" -Url $webAbsUrl -Confirm:$false

Disable-SPFeature -Identity "JEFS_JEFS Editor Feature" -Url $webAbsUrl -Confirm:$false -ErrorAction SilentlyContinue
Enable-SPFeature -Identity "JEFS_JEFS Editor Feature" -Url $webAbsUrl -Confirm:$false

write-host "Features activated"