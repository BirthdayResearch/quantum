import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MEUROC is ERC20 {
    constructor(string memory a, string memory b) ERC20(a, b) {}

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
