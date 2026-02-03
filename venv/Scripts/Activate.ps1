<#
.Synopsis
Activate a Python virtual environment for Cmdlet.

.Description
Pushes the python executable for this virtual environment to the front of the
PATH environment variable and sets the prompt to signify that you are in a
virtual environment. Discards the returned value.

.Parameter VenvDir
Path to the directory that contains the virtual environment to activate. The
default value for this is the parent of the directory that the Activate.ps1
script is located within.

.Example
C:\Users\MyUser\Envs\MyEnv\Scripts\Activate.ps1
Activates the MyEnv virtual environment.

.Example
Activate.ps1 -VenvDir C:\Users\MyUser\Envs\MyEnv
Activates the MyEnv virtual environment from the current directory.

#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [String]
    $VenvDir
)

if ($VenvDir) {
    $VenvPath = $VenvDir
} else {
    $VenvPath = (Resolve-Path "$PSScriptRoot\..").Path
}

$ActivateScript = Join-Path $VenvPath "pyvenv.cfg"
if (-not (Test-Path $ActivateScript)) {
    Write-Error "The virtual environment does not appear to be a valid Python virtual environment."
    return
}

$VenvExecutable = Join-Path $VenvPath "Scripts\python.exe"
if (-not (Test-Path $VenvExecutable)) {
    Write-Error "The virtual environment does not appear to contain a valid Python executable."
    return
}

# Deactivate any currently active virtual environment.
if ($env:VIRTUAL_ENV) {
    Write-Warning "Deactivating the currently active virtual environment"
    deactivate
}

$env:VIRTUAL_ENV = $VenvPath

if ($env:_OLD_VIRTUAL_PATH) {
    $env:PATH = $env:_OLD_VIRTUAL_PATH
}

$env:_OLD_VIRTUAL_PATH = $env:PATH
$env:PATH = "$VenvPath\Scripts;" + $env:PATH

# Clear PYTHONHOME if it is set.
if ($env:PYTHONHOME) {
    $env:_OLD_VIRTUAL_PYTHONHOME = $env:PYTHONHOME
    Remove-Item env:PYTHONHOME
}

# Add the virtual environment's site-packages to the Python path.
$env:_OLD_VIRTUAL_PS1 = $env:VIRTUAL_ENV_DISABLE_PROMPT
if (-not $env:VIRTUAL_ENV_DISABLE_PROMPT) {
    function global:deactivate ([switch]$NonDestructive) {
        # Restore the original environment.
        if (Test-Path function:_OLD_VIRTUAL_PROMPT) {
            Copy-Item function:_OLD_VIRTUAL_PROMPT function:prompt
            Remove-Item function:_OLD_VIRTUAL_PROMPT
        }

        if ($env:_OLD_VIRTUAL_PATH) {
            $env:PATH = $env:_OLD_VIRTUAL_PATH
            Remove-Item env:_OLD_VIRTUAL_PATH
        }

        if ($env:_OLD_VIRTUAL_PYTHONHOME) {
            $env:PYTHONHOME = $env:_OLD_VIRTUAL_PYTHONHOME
            Remove-Item env:_OLD_VIRTUAL_PYTHONHOME
        }

        if ($env:_OLD_VIRTUAL_PS1) {
            $env:VIRTUAL_ENV_DISABLE_PROMPT = $env:_OLD_VIRTUAL_PS1
            Remove-Item env:_OLD_VIRTUAL_PS1
        }

        if (-not $NonDestructive) {
            Remove-Item env:VIRTUAL_ENV
            if (Get-Command deactivate -ErrorAction SilentlyContinue) {
                Remove-Item function:deactivate
            }
        }
    }

    $script:prompt = $function:prompt
    function global:prompt {
        # Add the prefix to the current prompt.
        $previousPromptValue = & $script:prompt
        $venvPrompt = "($(Split-Path $env:VIRTUAL_ENV -Leaf)) "
        return $venvPrompt + $previousPromptValue
    }
}
