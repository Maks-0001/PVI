<?php
session_start();
session_unset();
session_destroy();
header("Location: /Lab_1/app/welcome.php");
exit;
