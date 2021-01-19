exports.Cluster = '172.23.121.84'
exports.RBACUser = "Administrator";
exports.RBACKPassword = "password";
exports.DefaultBucket = 'test_eventing'
exports.AuthPassword = ''
// exports.Buckets = ['server', 'sdk', 'mobile']
exports.Buckets = []
exports.httpListen = '127.0.0.1'
exports.httpPort = 8205
exports.CLAIM_MAP = {
    "git error": ["hudson.plugins.git.GitException"],
    "SSH error": ["paramiko.ssh_exception.SSHException"],
    "install failed": ["INSTALL FAILED ON"],
    "IPv6 test on IPv4 host": ["Cannot enable IPv6 on an IPv4 machine"],
    "Wrong python SDK version": ["ImportError: cannot import name 'N1QLQuery' from 'couchbase.n1ql'"] 
}