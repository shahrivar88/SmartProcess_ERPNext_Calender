from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = [
        line.strip()
        for line in f
        if line.strip() and not line.strip().startswith("#")
    ]

# Read version from __version__ variable in jalali_shamsi_datepicker/__init__.py
from jalali_shamsi_datepicker import __version__ as version

setup(
    name="jalali_shamsi_datepicker",
    version=version,
    description="Jalali display and input for Frappe Date and Datetime fields. Stored values stay Gregorian.",
    author="Ideenemium",
    author_email="ideenemium@gmail.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires
)